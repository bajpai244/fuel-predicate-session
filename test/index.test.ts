import { test, describe } from 'bun:test';
import {
  hexlify,
  keccak256,
  ScriptTransactionRequest,
  Wallet,
} from 'fuels';
import { launchTestNode } from 'fuels/test-utils';
import { SessionPredicate } from '../out';
import * as ed from "@noble/ed25519"
import { bytesToHex } from '@noble/hashes/utils';

describe('test session predicate', async () => {
  test('test sesssion works', async () => {
    const testNode = await launchTestNode();
    const provider = testNode.provider;

    const wallet = testNode.wallets[0];
    const randomRecepient = Wallet.generate().address;

    const baseAssetId = await provider.getBaseAssetId();

    const sessionPrivateKey = `0x${bytesToHex(ed.utils.randomPrivateKey())}`;
    const sessionPublicKey = `0x${bytesToHex(await ed.getPublicKeyAsync(sessionPrivateKey.slice(2)))}`;

    console.log('sessionPrivateKey', sessionPrivateKey);
    console.log('sessionPublicKey', sessionPublicKey);

    const sessionPredicate = new SessionPredicate({
      configurableConstants: {
        MAIN_ADDRESS: wallet.address.toB256(),
        SESSION_ADDRESS_PUBLIC_KEY: sessionPublicKey,
      },
      data: [0],
      provider,
    });

    const sessionPredicateAddress = sessionPredicate.address;
    const amount = 133993000;

    const sessionPredicateBalanceBefore = await sessionPredicate.getBalance();
    console.log('sessionPredicateBalanceBefore', sessionPredicateBalanceBefore);

    // Step 1: Send some assets to the session predicate
    await (
      await wallet.transfer(sessionPredicateAddress, amount)
    ).waitForResult();

    const sessionWalletPredicateBalanceAfter =
      await sessionPredicate.getBalance();
    console.log(
      'sessionWalletPredicateBalanceAfter',
      sessionWalletPredicateBalanceAfter
    );

    // Step 2: Use the session wallet to send some assets to the random recipient
    const scriptTransactionRequest = new ScriptTransactionRequest();

    const resources = await sessionPredicate.getResourcesToSpend([
      { amount, assetId: baseAssetId },
    ]);

    scriptTransactionRequest.addResources(resources);
    scriptTransactionRequest.addChangeOutput(
      randomRecepient,
      baseAssetId
    );

    // const message = keccak256(new Uint8Array([0, 1, 2]));
    // const messageHex = bytesToHex(message);

    const txId = scriptTransactionRequest.getTransactionId(await provider.getChainId());

    console.log('txId', txId);

    // console.log('message hex', messageHex);
    // const signature = bytesToHex(await ed.signAsync(messageHex, sessionPrivateKey.slice(2)));
    let signature = bytesToHex(await ed.signAsync(txId.slice(2), sessionPrivateKey.slice(2)));

    console.log('sign', signature);

    // scriptTransactionRequest.addWitness(await sessionWallet.signTransaction(scriptTransactionRequest));
    scriptTransactionRequest.addWitness(
      `0x${signature}`
    );

    const {gasPrice, gasLimit, maxFee, minFee} = await provider.estimateTxGasAndFee({transactionRequest: scriptTransactionRequest});
    scriptTransactionRequest.gasLimit = gasLimit;
    scriptTransactionRequest.maxFee = maxFee.mul(2);

    await provider.estimatePredicates(scriptTransactionRequest);

    // change the witness data
    const witnessIndex = scriptTransactionRequest.witnesses.findIndex((w) => {
         return hexlify(w) === `0x${signature}`;
    });
    if(witnessIndex === -1) {
      throw new Error('Target witness not found');
    }

    signature = bytesToHex(await ed.signAsync(scriptTransactionRequest.getTransactionId(await provider.getChainId()).slice(2), sessionPrivateKey.slice(2)));
    scriptTransactionRequest.witnesses[witnessIndex] = `0x${signature}`;

    console.log('inputs', scriptTransactionRequest.inputs[0]);
    // return;

    // sessionPredicate.predicateData = [witnessIndex];
    // console.log(scriptTransactionRequest.inputs)
    // sessionPredicate.populateTransactionPredicateData(scriptTransactionRequest);

    // const r= await provider.estimatePredicates(scriptTransactionRequest);
    // console.log(r.inputs)

    console.log(
      'recepient balance before:',
      await provider.getBalance(randomRecepient, baseAssetId)
    );

    const {status, transaction, id} = await (await provider.sendTransaction(scriptTransactionRequest)).waitForResult();

    console.log('transaction witnesses', transaction.witnesses);
    console.log('transaction id', id);

    console.log(
      'recepient balance after:',
      await provider.getBalance(randomRecepient, baseAssetId)
    );

    console.log('status', status);

    // const privKey = bytesToHex( ed.utils.randomPrivateKey());
    // console.log('privKey', privKey);
    // const pubKey = bytesToHex(await ed.getPublicKeyAsync(privKey)); // Sync methods below
    // console.log('pubKey', pubKey);

    // console.log('messageHex', messageHex);

    // const signature2 = bytesToHex(await ed.signAsync(messageHex, privKey));
    // console.log('signature', signature2);
    // const isValid = await ed.verifyAsync(signature, messageHex , pubKey);
    // console.log('verified', isValid);
  });
});
