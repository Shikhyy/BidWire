#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    token::{StellarAssetClient, TokenClient},
    Address, Env, Map, Symbol, Vec,
};

#[derive(Clone)]
#[contracttype]
pub struct Bid {
    pub bidder: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub tx_hash: Symbol,
}

#[derive(Clone)]
#[contracttype]
pub struct AuctionState {
    pub provider: Address,
    pub resource_type: Symbol,
    pub resource_description: Symbol,
    pub starting_bid: i128,
    pub min_increment: i128,
    pub reserve_price: i128,
    pub current_leader: Address,
    pub current_bid: i128,
    pub bid_count: u32,
    pub ends_at: u64,
    pub status: u32,
    pub mode: u32,
}

const STATUS_PENDING: u32 = 0;
const STATUS_OPEN: u32 = 1;
const STATUS_CLOSING: u32 = 2;
const STATUS_SETTLED: u32 = 3;
const STATUS_ARCHIVED: u32 = 4;

const MODE_STANDARD: u32 = 0;
const MODE_REVERSE: u32 = 1;

const BID_COUNT: Symbol = Symbol::new(&Env::default(), "bid_count");
const AUCTION_PREFIX: Symbol = Symbol::new(&Env::default(), "auction");

pub struct BidwireEscrow;

fn auction_key(env: &Env, auction_id: &Symbol) -> Symbol {
    let mut key = Vec::new(env);
    key.push_back(AUCTION_PREFIX.clone());
    key.push_back(auction_id.clone());
    Symbol::from_vec(env, &key)
}

fn bids_key(env: &Env, auction_id: &Symbol) -> Symbol {
    let mut key = Vec::new(env);
    key.push_back(Symbol::new(env, "bids"));
    key.push_back(auction_id.clone());
    Symbol::from_vec(env, &key)
}

#[contractimpl]
impl BidwireEscrow {
    pub fn init(env: Env, admin: Address) {
        admin.require_auth();
    }

    pub fn create_auction(
        env: Env,
        auction_id: Symbol,
        provider: Address,
        resource_type: Symbol,
        resource_description: Symbol,
        starting_bid: i128,
        min_increment: i128,
        reserve_price: i128,
        ends_at: u64,
        mode: u32,
    ) -> AuctionState {
        provider.require_auth();

        let state = AuctionState {
            provider,
            resource_type,
            resource_description,
            starting_bid,
            min_increment,
            reserve_price,
            current_leader: Address::from_account_id(&env, &[0u8; 32]),
            current_bid: starting_bid,
            bid_count: 0,
            ends_at,
            status: STATUS_OPEN,
            mode,
        };

        env.storage()
            .instance()
            .set(&auction_key(&env, &auction_id), &state);

        let empty_bids: Vec<Bid> = Vec::new(&env);
        env.storage()
            .instance()
            .set(&bids_key(&env, &auction_id), &empty_bids);

        state
    }

    pub fn get_auction(env: Env, auction_id: Symbol) -> Option<AuctionState> {
        env.storage()
            .instance()
            .get(&auction_key(&env, &auction_id))
    }

    pub fn submit_bid(
        env: Env,
        auction_id: Symbol,
        bidder: Address,
        amount: i128,
        tx_hash: Symbol,
    ) -> (Bid, Option<Address>, i128) {
        bidder.require_auth();

        let mut state = env
            .storage()
            .instance()
            .get::<Symbol, AuctionState>(&auction_key(&env, &auction_id))
            .unwrap_or_else(|| panic!("Auction not found"));

        if state.status != STATUS_OPEN {
            panic!("Auction is not open");
        }

        if env.ledger().timestamp() >= state.ends_at {
            panic!("Auction has ended");
        }

        let min_next_bid = state.current_bid + state.min_increment;
        if amount < min_next_bid {
            panic!("Bid too low: minimum is {}", min_next_bid);
        }

        let previous_leader = state.current_leader.clone();
        let previous_bid = state.current_bid;

        let bid = Bid {
            bidder: bidder.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
            tx_hash,
        };

        state.current_leader = bidder;
        state.current_bid = amount;
        state.bid_count += 1;

        env.storage()
            .instance()
            .set(&auction_key(&env, &auction_id), &state);

        let mut bids: Vec<Bid> = env
            .storage()
            .instance()
            .get(&bids_key(&env, &auction_id))
            .unwrap_or_else(|| Vec::new(&env));
        bids.push_back(bid.clone());

        env.storage()
            .instance()
            .set(&bids_key(&env, &auction_id), &bids);

        if previous_leader != Address::from_account_id(&env, &[0u8; 32]) {
            (bid, Some(previous_leader), previous_bid)
        } else {
            (bid, None, 0)
        }
    }

    pub fn get_bids(env: Env, auction_id: Symbol) -> Vec<Bid> {
        env.storage()
            .instance()
            .get(&bids_key(&env, &auction_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn close_auction(env: Env, auction_id: Symbol) -> (Symbol, Symbol, Vec<Address>) {
        let mut state = env
            .storage()
            .instance()
            .get::<Symbol, AuctionState>(&auction_key(&env, &auction_id))
            .unwrap_or_else(|| panic!("Auction not found"));

        if state.status != STATUS_OPEN {
            panic!("Auction is not open");
        }

        state.status = STATUS_CLOSING;

        env.storage()
            .instance()
            .set(&auction_key(&env, &auction_id), &state);

        let bids: Vec<Bid> = env
            .storage()
            .instance()
            .get(&bids_key(&env, &auction_id))
            .unwrap_or_else(|| Vec::new(&env));

        let winner = state.current_leader.clone();
        let winning_bid = state.current_bid;
        let provider = state.provider.clone();

        let mut refund_list: Vec<Address> = Vec::new(&env);

        if state.current_bid < state.reserve_price {
            for i in 0..bids.len() {
                let bid = bids.get(i).unwrap();
                refund_list.push_back(bid.bidder);
            }
            state.status = STATUS_ARCHIVED;
        } else {
            for i in 0..bids.len() {
                let bid = bids.get(i).unwrap();
                if bid.bidder != winner {
                    refund_list.push_back(bid.bidder);
                }
            }
            state.status = STATUS_SETTLED;
        }

        env.storage()
            .instance()
            .set(&auction_key(&env, &auction_id), &state);

        let settlement_tx = Symbol::new(&env, "settled");
        let settlement_refunds = Symbol::new(&env, "refs");

        (settlement_tx, settlement_refunds, refund_list)
    }

    pub fn refund_bid(env: Env, recipient: Address, amount: i128) {
        recipient.require_auth();
    }
}
