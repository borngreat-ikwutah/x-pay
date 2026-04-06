#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, xdr::ToXdr, Address, BytesN, Env, Map, Symbol,
};

/// Enum for error handling
#[soroban_sdk::contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    NotInitialized = 1,
    Unauthorized = 2,
    ProviderNotWhitelisted = 3,
    SessionExpired = 4,
    LimitExceeded = 5,
    InvalidAmount = 6,
    SessionNotFound = 7,
    InvalidSignature = 8,
}

#[contracttype]
pub struct Session {
    pub token: Address,
    pub limit: i128,
    pub period: u64,   // time period in seconds
    pub deadline: u64, // timestamp
    pub spent_in_period: i128,
    pub period_start: u64, // timestamp
    pub escrowed_amount: i128,
}

pub const WHITELIST: Symbol = soroban_sdk::symbol_short!("WHITELIST");
pub const SESSIONS: Symbol = soroban_sdk::symbol_short!("SESSIONS"); // Map<(Address, Address), Session>

#[contract]
pub struct XpayGuard;

#[contractimpl]
impl XpayGuard {
    /// Initializes a payment session, setting budgets and escrowing funds.
    /// Feature 2: Multi-Hop "Auth Entries" (User authorizes this via Soroban auth tree)
    /// Feature 5: Automatic Expiry (deadline)
    pub fn init_session(
        env: Env,
        user: Address,
        agent: Address,
        token: Address,
        escrow_amount: i128,
        limit: i128,
        period: u64,
        deadline: u64,
    ) {
        user.require_auth();

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&user, &env.current_contract_address(), &escrow_amount);

        let mut sessions: Map<(Address, Address), Session> = env
            .storage()
            .instance()
            .get(&SESSIONS)
            .unwrap_or_else(|| Map::new(&env));

        let session = Session {
            token: token.clone(),
            limit,
            period,
            deadline,
            spent_in_period: 0,
            period_start: env.ledger().timestamp(),
            escrowed_amount: escrow_amount,
        };

        sessions.set((user, agent), session);
        env.storage().instance().set(&SESSIONS, &sessions);
    }

    /// Add a service to the whitelist (Admin/User logic depending on requirements)
    pub fn add_approved_provider(env: Env, owner: Address, provider: Address) {
        owner.require_auth();
        let mut wl: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&WHITELIST)
            .unwrap_or_else(|| Map::new(&env));
        wl.set(provider, true);
        env.storage().instance().set(&WHITELIST, &wl);
    }

    /// Feature 1 + Feature 3: Agent calls this to make a payment to a whitelisted provider
    pub fn pay_service(
        env: Env,
        agent: Address,
        user: Address,
        destination: Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        agent.require_auth();

        // 3. The "Service Provider" Whitelist
        let wl: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&WHITELIST)
            .unwrap_or_else(|| Map::new(&env));
        if !wl.get(destination.clone()).unwrap_or(false) {
            return Err(ContractError::ProviderNotWhitelisted);
        }

        let mut sessions: Map<(Address, Address), Session> = env
            .storage()
            .instance()
            .get(&SESSIONS)
            .unwrap_or_else(|| Map::new(&env));
        let mut session = sessions
            .get((user.clone(), agent.clone()))
            .ok_or(ContractError::SessionNotFound)?;

        let current_time = env.ledger().timestamp();
        // 5. Automatic Expiry
        if current_time > session.deadline {
            return Err(ContractError::SessionExpired);
        }

        // 1. Programmable Allowances
        if current_time >= session.period_start + session.period {
            session.spent_in_period = 0;
            session.period_start = current_time;
        }

        if session.spent_in_period + amount > session.limit {
            return Err(ContractError::LimitExceeded);
        }

        if amount > session.escrowed_amount {
            return Err(ContractError::InvalidAmount);
        }

        session.spent_in_period += amount;
        session.escrowed_amount -= amount;

        // Perform SAC transfer
        let token_client = token::Client::new(&env, &session.token);
        token_client.transfer(&env.current_contract_address(), &destination, &amount);

        sessions.set((user.clone(), agent.clone()), session);
        env.storage().instance().set(&SESSIONS, &sessions);

        Ok(())
    }

    /// Feature 4: Off-Chain Signature Settlement (Payment Channels)
    /// Claims a sequence of accumulated off-chain micropayments via ed25519 signature
    pub fn claim_sequence(
        env: Env,
        user_pubkey: BytesN<32>, // The literal ED25519 user pubkey
        user: Address,
        agent: Address,
        destination: Address,
        total_amount: i128,
        signature: BytesN<64>,
    ) -> Result<(), ContractError> {
        agent.require_auth();

        let mut payload = soroban_sdk::Bytes::new(&env);
        // serialize the amount as payload
        payload.append(&total_amount.to_xdr(&env));

        env.crypto()
            .ed25519_verify(&user_pubkey, &payload, &signature);

        // Perform standard payment logic for the total off-chain amount
        let mut sessions: Map<(Address, Address), Session> = env
            .storage()
            .instance()
            .get(&SESSIONS)
            .unwrap_or_else(|| Map::new(&env));
        let mut session = sessions
            .get((user.clone(), agent.clone()))
            .ok_or(ContractError::SessionNotFound)?;

        let current_time = env.ledger().timestamp();
        if current_time > session.deadline {
            return Err(ContractError::SessionExpired);
        }

        // Check if amount exceeds escrow
        if total_amount > session.escrowed_amount {
            return Err(ContractError::InvalidAmount);
        }

        session.escrowed_amount -= total_amount;

        // Perform SAC transfer
        let token_client = token::Client::new(&env, &session.token);
        token_client.transfer(&env.current_contract_address(), &destination, &total_amount);

        sessions.set((user.clone(), agent.clone()), session);
        env.storage().instance().set(&SESSIONS, &sessions);

        Ok(())
    }

    /// Return any remaining escrowed funds to main wallet after deadline
    pub fn claim_refund(env: Env, user: Address, agent: Address) -> Result<(), ContractError> {
        let mut sessions: Map<(Address, Address), Session> = env
            .storage()
            .instance()
            .get(&SESSIONS)
            .unwrap_or_else(|| Map::new(&env));
        let session = sessions
            .get((user.clone(), agent.clone()))
            .ok_or(ContractError::SessionNotFound)?;

        let current_time = env.ledger().timestamp();

        if current_time <= session.deadline {
            // Require user auth to claim refund early before expiry
            user.require_auth();
        }

        if session.escrowed_amount > 0 {
            let token_client = token::Client::new(&env, &session.token);
            token_client.transfer(
                &env.current_contract_address(),
                &user,
                &session.escrowed_amount,
            );
        }

        sessions.remove((user.clone(), agent.clone()));
        env.storage().instance().set(&SESSIONS, &sessions);

        Ok(())
    }
}

mod test;
