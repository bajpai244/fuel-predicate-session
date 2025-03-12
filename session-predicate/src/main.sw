predicate;

use std::{
    inputs::{input_coin_owner},
    tx::{tx_witness_data, tx_id},
    b512::B512,
    bytes::Bytes,
    ecr::ed_verify,
};

configurable {
    SESSION_ADDRESS_PUBLIC_KEY: b256 = 0x09c0b2d1a486c439a87bcba6b46a7a1a23f3897cc83a94521a96da5c23bc58db,
    MAIN_ADDRESS: b256 = 0x09c0b2d1a486c439a87bcba6b46a7a1a23f3897cc83a94521a96da5c23bc58db,
}

fn main(session_witness_index: u64, main_address_input_index: Option<u64>) -> bool {

    let main_address = Address::from(MAIN_ADDRESS);

    let is_valid = match main_address_input_index {
        Some(input_index) => {
            return match input_coin_owner(input_index) {
                Some(owner_address) => owner_address == main_address,
                None => false,
            };
        },
        None => {
            let witness_data: B512 = tx_witness_data(session_witness_index).unwrap();
        
            return ed_verify(SESSION_ADDRESS_PUBLIC_KEY, witness_data, Bytes::from(tx_id())).unwrap();
        },
    };
    
    is_valid
}