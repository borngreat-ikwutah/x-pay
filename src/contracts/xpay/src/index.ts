import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CD6G6FF2NTMK4XHXPYQNTGR5FRSHPURIPIPOUZDT37OBHLUWPGXFU35W",
  }
} as const


export interface Session {
  deadline: u64;
  escrowed_amount: i128;
  limit: i128;
  period: u64;
  period_start: u64;
  spent_in_period: i128;
  token: string;
}

/**
 * Enum for error handling
 */
export const ContractError = {
  1: {message:"NotInitialized"},
  2: {message:"Unauthorized"},
  3: {message:"ProviderNotWhitelisted"},
  4: {message:"SessionExpired"},
  5: {message:"LimitExceeded"},
  6: {message:"InvalidAmount"},
  7: {message:"SessionNotFound"},
  8: {message:"InvalidSignature"}
}

export interface Client {
  /**
   * Construct and simulate a pay_service transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Feature 1 + Feature 3: Agent calls this to make a payment to a whitelisted provider
   */
  pay_service: ({agent, user, destination, amount}: {agent: string, user: string, destination: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a claim_refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Return any remaining escrowed funds to main wallet after deadline
   */
  claim_refund: ({user, agent}: {user: string, agent: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a init_session transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initializes a payment session, setting budgets and escrowing funds.
   * Feature 2: Multi-Hop "Auth Entries" (User authorizes this via Soroban auth tree)
   * Feature 5: Automatic Expiry (deadline)
   */
  init_session: ({user, agent, token, escrow_amount, limit, period, deadline}: {user: string, agent: string, token: string, escrow_amount: i128, limit: i128, period: u64, deadline: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a claim_sequence transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Feature 4: Off-Chain Signature Settlement (Payment Channels)
   * Claims a sequence of accumulated off-chain micropayments via ed25519 signature
   */
  claim_sequence: ({user_pubkey, user, agent, destination, total_amount, signature}: {user_pubkey: Buffer, user: string, agent: string, destination: string, total_amount: i128, signature: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a add_approved_provider transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add a service to the whitelist (Admin/User logic depending on requirements)
   */
  add_approved_provider: ({owner, provider}: {owner: string, provider: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAAB1Nlc3Npb24AAAAABwAAAAAAAAAIZGVhZGxpbmUAAAAGAAAAAAAAAA9lc2Nyb3dlZF9hbW91bnQAAAAACwAAAAAAAAAFbGltaXQAAAAAAAALAAAAAAAAAAZwZXJpb2QAAAAAAAYAAAAAAAAADHBlcmlvZF9zdGFydAAAAAYAAAAAAAAAD3NwZW50X2luX3BlcmlvZAAAAAALAAAAAAAAAAV0b2tlbgAAAAAAABM=",
        "AAAABAAAABdFbnVtIGZvciBlcnJvciBoYW5kbGluZwAAAAAAAAAADUNvbnRyYWN0RXJyb3IAAAAAAAAIAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAQAAAAAAAAAMVW5hdXRob3JpemVkAAAAAgAAAAAAAAAWUHJvdmlkZXJOb3RXaGl0ZWxpc3RlZAAAAAAAAwAAAAAAAAAOU2Vzc2lvbkV4cGlyZWQAAAAAAAQAAAAAAAAADUxpbWl0RXhjZWVkZWQAAAAAAAAFAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAABgAAAAAAAAAPU2Vzc2lvbk5vdEZvdW5kAAAAAAcAAAAAAAAAEEludmFsaWRTaWduYXR1cmUAAAAI",
        "AAAAAAAAAFNGZWF0dXJlIDEgKyBGZWF0dXJlIDM6IEFnZW50IGNhbGxzIHRoaXMgdG8gbWFrZSBhIHBheW1lbnQgdG8gYSB3aGl0ZWxpc3RlZCBwcm92aWRlcgAAAAALcGF5X3NlcnZpY2UAAAAABAAAAAAAAAAFYWdlbnQAAAAAAAATAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAALZGVzdGluYXRpb24AAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAEFSZXR1cm4gYW55IHJlbWFpbmluZyBlc2Nyb3dlZCBmdW5kcyB0byBtYWluIHdhbGxldCBhZnRlciBkZWFkbGluZQAAAAAAAAxjbGFpbV9yZWZ1bmQAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAFYWdlbnQAAAAAAAATAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAALtJbml0aWFsaXplcyBhIHBheW1lbnQgc2Vzc2lvbiwgc2V0dGluZyBidWRnZXRzIGFuZCBlc2Nyb3dpbmcgZnVuZHMuCkZlYXR1cmUgMjogTXVsdGktSG9wICJBdXRoIEVudHJpZXMiIChVc2VyIGF1dGhvcml6ZXMgdGhpcyB2aWEgU29yb2JhbiBhdXRoIHRyZWUpCkZlYXR1cmUgNTogQXV0b21hdGljIEV4cGlyeSAoZGVhZGxpbmUpAAAAAAxpbml0X3Nlc3Npb24AAAAHAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAFYWdlbnQAAAAAAAATAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAADWVzY3Jvd19hbW91bnQAAAAAAAALAAAAAAAAAAVsaW1pdAAAAAAAAAsAAAAAAAAABnBlcmlvZAAAAAAABgAAAAAAAAAIZGVhZGxpbmUAAAAGAAAAAA==",
        "AAAAAAAAAItGZWF0dXJlIDQ6IE9mZi1DaGFpbiBTaWduYXR1cmUgU2V0dGxlbWVudCAoUGF5bWVudCBDaGFubmVscykKQ2xhaW1zIGEgc2VxdWVuY2Ugb2YgYWNjdW11bGF0ZWQgb2ZmLWNoYWluIG1pY3JvcGF5bWVudHMgdmlhIGVkMjU1MTkgc2lnbmF0dXJlAAAAAA5jbGFpbV9zZXF1ZW5jZQAAAAAABgAAAAAAAAALdXNlcl9wdWJrZXkAAAAD7gAAACAAAAAAAAAABHVzZXIAAAATAAAAAAAAAAVhZ2VudAAAAAAAABMAAAAAAAAAC2Rlc3RpbmF0aW9uAAAAABMAAAAAAAAADHRvdGFsX2Ftb3VudAAAAAsAAAAAAAAACXNpZ25hdHVyZQAAAAAAA+4AAABAAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAEtBZGQgYSBzZXJ2aWNlIHRvIHRoZSB3aGl0ZWxpc3QgKEFkbWluL1VzZXIgbG9naWMgZGVwZW5kaW5nIG9uIHJlcXVpcmVtZW50cykAAAAAFWFkZF9hcHByb3ZlZF9wcm92aWRlcgAAAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAIcHJvdmlkZXIAAAATAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    pay_service: this.txFromJSON<Result<void>>,
        claim_refund: this.txFromJSON<Result<void>>,
        init_session: this.txFromJSON<null>,
        claim_sequence: this.txFromJSON<Result<void>>,
        add_approved_provider: this.txFromJSON<null>
  }
}