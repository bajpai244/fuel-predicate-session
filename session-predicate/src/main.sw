predicate;

use std::{
    inputs::{input_coin_owner},
    tx::{tx_witness_data, tx_id},
    b512::B512,
    bytes::Bytes,
    crypto::secp256k1::Secp256k1,
    crypto::public_key::PublicKey,
    crypto::message::Message,
};

configurable {
    SESSION_ADDRESS_PUBLIC_KEY:  B512 = B512::from((0x0000000000000000000000000000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000000000000000000000000000)),
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
            let signature: Secp256k1 = witness_data.into();

            let message: Message = Bytes::from(tx_id()).into();
            let message: Message = Bytes::from(0xf84a97f1f0a956e738abd85c2e0a5026f8874e3ec09c8f012159dfeeaab2b156).into();
            let public_key: PublicKey = PublicKey::from(SESSION_ADDRESS_PUBLIC_KEY);

            let result = signature.verify(public_key, message);
            let a = result.is_ok();
        
            // return ed_verify(SESSION_ADDRESS_PUBLIC_KEY, witness_data, Bytes::from(tx_id())).unwrap();
            !a
            // true
        },
    };
    
    is_valid
}