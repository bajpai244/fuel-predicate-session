import { test, describe } from 'bun:test';
import { Provider, Wallet } from 'fuels';
import { launchTestNode } from 'fuels/test-utils';
import { SessionPredicate } from '../out';

describe('test session predicate', async () => {
  const testNode = await launchTestNode();

  test('test sesssion works', async () => {
    const provider = testNode.provider;
    const wallet = testNode.wallets[0];

    const sessionWallet = Wallet.generate();
    console.log('balance', await wallet.getBalance());

    const sessionPredicate = new SessionPredicate({
      configurableConstants: {
        MAIN_ADDRESS: wallet.address.toB256(),
        SESSION_ADDRESS_PUBLIC_KEY: sessionWallet.publicKey,
      },
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

  });
});
