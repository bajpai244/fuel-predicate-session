import { test, describe } from 'bun:test';
import { B512Coder, hexlify, InputType, keccak256, max, ScriptRequest, ScriptTransactionRequest, Wallet } from 'fuels';
import { launchTestNode } from 'fuels/test-utils';
import { SessionPredicate } from '../out';

describe('test session predicate', async () => {

  test('test sesssion works', async () => {
    const testNode = await launchTestNode();
    const provider = testNode.provider;

    const wallet = testNode.wallets[0];
    const randomRecepient = Wallet.generate().address;

    const sessionWallet = Wallet.generate({provider});
    const baseAssetId = await provider.getBaseAssetId();

    // funding session wallet for gas
    await (await wallet.transfer(sessionWallet.address, 100000)).waitForResult();
    
    console.log('balance', await wallet.getBalance());

    console.log('sessionWallet', sessionWallet.signer().compressedPublicKey.length);
    console.log('sessionWallet', sessionWallet.signer().compressedPublicKey);

    // const sessionWalletPublicKey= hexlify(new Uint8Array(Buffer.from(sessionWallet.signer().compressedPublicKey.slice(2), 'hex')).slice(1));

    const sessionPredicate = new SessionPredicate({
      configurableConstants: {
        MAIN_ADDRESS: wallet.address.toB256(),
        SESSION_ADDRESS_PUBLIC_KEY: sessionWallet.publicKey,
      },
      data: [0],
      provider,
    });

    const sessionPredicateAddress = sessionPredicate.address;
    const amount = 10;

    const sessionPredicateBalanceBefore = await sessionPredicate.getBalance();
    console.log('sessionPredicateBalanceBefore', sessionPredicateBalanceBefore);

    // Step 1: Send some assets to the session predicate
    await (await wallet.transfer(sessionPredicateAddress, amount)).waitForResult();

    const sessionWalletPredicateBalanceAfter = await sessionPredicate.getBalance(); 
    console.log('sessionWalletPredicateBalanceAfter', sessionWalletPredicateBalanceAfter);

    // Step 2: Use the session wallet to send some assets to the random recipient
    const scriptTransactionRequest = new ScriptTransactionRequest();

    const resources = await sessionPredicate.getResourcesToSpend([{amount, assetId: baseAssetId}]);

    scriptTransactionRequest.addResources(resources);
    scriptTransactionRequest.addCoinOutput(randomRecepient, amount, baseAssetId);

    const message = keccak256(new Uint8Array([0,1,2]));
    const messageHex = hexlify(message);

    console.log('message hex', messageHex);
    console.log('sign', await sessionWallet.signMessage(messageHex))

    scriptTransactionRequest.addWitness(await sessionWallet.signTransaction(scriptTransactionRequest));

    console.log("scriptransaction inputs", scriptTransactionRequest.inputs);

    await scriptTransactionRequest.estimateAndFund(sessionWallet);

    console.log("scriptransaction inputs", scriptTransactionRequest.inputs);

    sessionPredicate.predicateData = [0];
    sessionPredicate.populateTransactionPredicateData(scriptTransactionRequest);

    // scriptTransactionRequest.witnesses = [];

    console.log('recepient balance before:', await provider.getBalance(randomRecepient, baseAssetId));

    const {status} = await (await sessionWallet.sendTransaction(scriptTransactionRequest)).waitForResult();

    console.log('recepient balance after:', await provider.getBalance(randomRecepient, baseAssetId));

    console.log("status", status);
  });
});
