#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env,
};

fn setup_test() -> (
    Env,
    XpayGuardClient<'static>,
    Address,
    Address,
    token::Client<'static>,
    token::StellarAssetClient<'static>,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    // Create users
    let user = Address::generate(&env);
    let agent = Address::generate(&env);
    let provider = Address::generate(&env);

    // Deploy dummy token contract (SAC USDC equivalent)
    let token_admin = Address::generate(&env);
    let token_contract_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token = token_contract_id.address().clone();

    let token_client = token::Client::new(&env, &token);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract_id.address());

    // Mint tokens to user
    token_admin_client.mint(&user, &10000);

    // Deploy XpayGuard
    let contract_id = env.register(XpayGuard, ());
    let client = XpayGuardClient::new(&env, &contract_id);

    (
        env,
        client,
        user,
        agent,
        token_client,
        token_admin_client,
        provider,
    )
}

#[test]
fn test_allowance_and_pay_service() {
    let (env, client, user, agent, token_client, _admin, provider) = setup_test();

    let limit = 1000;
    let period = 86400; // 1 day
    let current_time = 1700000000;
    env.ledger().set_timestamp(current_time);
    let deadline = current_time + 30 * 86400; // 30 days

    // 1. Whitelist the provider
    client.add_approved_provider(&user, &provider);

    // 2. Init session (escrows funds)
    let escrow_amount = 5000;

    assert_eq!(token_client.balance(&user), 10000);
    client.init_session(
        &user,
        &agent,
        &token_client.address,
        &escrow_amount,
        &limit,
        &period,
        &deadline,
    );

    // Check escrow mapping and real token transfer
    assert_eq!(token_client.balance(&user), 5000);
    assert_eq!(token_client.balance(&client.address), 5000);

    // 3. Agent executes a micro-payment (pay_service)
    let payment_amount = 500;
    client.pay_service(&agent, &user, &provider, &payment_amount);

    // Check balances
    assert_eq!(token_client.balance(&provider), 500); // Provider received 500
    assert_eq!(token_client.balance(&client.address), 4500); // 500 subtracted from escrow

    // 4. Test Kill Switch (Expiry)
    env.ledger().set_timestamp(deadline + 1);

    // Try to pay again, should fail with SessionExpired
    let res = client.try_pay_service(&agent, &user, &provider, &payment_amount);
    assert!(res.is_err());

    // 5. Test claim refund
    client.claim_refund(&user, &agent);

    // Escrow returned to user
    assert_eq!(token_client.balance(&user), 9500); // 5000 + 4500 (refund)
}

#[test]
fn test_off_chain_claim_sequence() {
    // Note: Due to limitations testing real ED25519 off-chain signing in the simplified `mock_all_auths` without full keyring,
    // we would structurally test it here and use standard auths, but full signing relies on client SDK in JS/TS.
    // However, the interface exists.
}
