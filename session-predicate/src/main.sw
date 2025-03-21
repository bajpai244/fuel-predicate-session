predicate;

use std::{
    b512::B512,
    bytes::Bytes,
    crypto::ed25519::Ed25519,
    crypto::message::Message,
    crypto::public_key::PublicKey,
    crypto::secp256k1::Secp256k1,
    hash::{
        Hash,
        sha256,
    },
    inputs::{
        input_coin_owner,
    },
    tx::{
        tx_id,
        tx_witness_data,
    },
};

configurable {
    SESSION_ADDRESS_PUBLIC_KEY: b256 = 0x0000000000000000000000000000000000000000000000000000000000000000,
    MAIN_ADDRESS: b256 = 0x09c0b2d1a486c439a87bcba6b46a7a1a23f3897cc83a94521a96da5c23bc58db,
}

fn main(
    session_witness_index: u64,
    main_address_input_index: Option<u64>,
) -> bool {
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
            let signature: Ed25519 = witness_data.into();

            let message: Message = Bytes::from(tx_id()).into();

            let public_key: PublicKey = PublicKey::from(SESSION_ADDRESS_PUBLIC_KEY);

            // true
            let result = signature.verify(public_key, message);
            result.is_ok()
        },
    };

    is_valid
}
