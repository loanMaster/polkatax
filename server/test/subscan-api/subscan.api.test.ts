import {beforeEach, describe, expect, jest, test} from '@jest/globals';
import {SubscanApi} from "../../src/substrate-blockchain/api/subscan.api";
import {BigNumber} from "bignumber.js";

let subscanApi: SubscanApi;

beforeEach(() => {
    process.env['SUBSCAN_API_KEY'] = 'my-key'
    subscanApi = new SubscanApi()
})

function setUpRequestHelper(response: any) {
    const requestHelper = {
        req: async () => response
    }
    const requestHelperSpy = jest.spyOn(requestHelper, "req");
    return {requestHelper, requestHelperSpy}
}

test('should mapToSubstrateAccount', async () => {
    const {requestHelper, requestHelperSpy} = setUpRequestHelper({data: {account: {substrate_account: {address: "my-address"}}}});
    (subscanApi as any)['requestHelper'] = requestHelper
    const mappedAccount = await subscanApi.mapToSubstrateAccount('polkadot', 'foo')
    expect(mappedAccount).toBe("my-address")
    expect(requestHelperSpy).toHaveBeenCalledWith(`https://polkadot.api.subscan.io/api/v2/scan/search`, 'post', {key: 'foo'})
})

test('should fetch metadata avg block time', async () => {
    let {requestHelper, requestHelperSpy} = setUpRequestHelper({data: {avgBlockTime: 6, blockNum: "10"}});
    (subscanApi as any)['requestHelper'] = requestHelper
    const metaData = await subscanApi.fetchMetadata('kusama')
    expect(metaData.blockNum).toBe(10)
    expect(metaData.avgBlockTime).toBe(6)
    expect(requestHelperSpy).toHaveBeenCalledWith(`https://kusama.api.subscan.io/api/scan/metadata`, 'post', {})
})

test('should fetch metadata block time', async () => {
    let {requestHelper, requestHelperSpy} = setUpRequestHelper({data: {blockTime: 2, blockNum: "10"}});
    (subscanApi as any)['requestHelper'] = requestHelper
    const metaData = await subscanApi.fetchMetadata('kusama')
    expect(metaData.blockNum).toBe(10)
    expect(metaData.avgBlockTime).toBe(2)
    expect(requestHelperSpy).toHaveBeenCalledWith(`https://kusama.api.subscan.io/api/scan/metadata`, 'post', {})
})

test('should fetchNativeToken', async () => {
    let {requestHelper, requestHelperSpy} = setUpRequestHelper({
        data: {
            detail: {
                USDT: {asset_type: 'sth', token_decimals: 10, price: 1.0},
                DOT: {asset_type: 'native', token_decimals: 18, price: 4.0},
                USDC: {asset_type: 'bla', token_decimals: 10, price: 1.0}
            }
        }
    });
    (subscanApi as any)['requestHelper'] = requestHelper
    const nativeToken = await subscanApi.fetchNativeToken('somechain')
    expect(nativeToken).toEqual({asset_type: 'native', token_decimals: 18, price: 4.0})
    expect(requestHelperSpy).toHaveBeenCalledWith(`https://somechain.api.subscan.io/api/scan/token`, 'post', {})
})

test('should fetchBlock', async () => {
    let {requestHelper, requestHelperSpy} = setUpRequestHelper({
        data: {
            block_num: 1,
            block_timestamp: 1000,
        }
    });
    (subscanApi as any)['requestHelper'] = requestHelper
    const block = await subscanApi.fetchBlock('kusama', 22)
    expect(block.block_num).toBe(1)
    expect(block.block_timestamp).toBe(1000)
    expect(requestHelperSpy).toHaveBeenCalledWith(`https://kusama.api.subscan.io/api/scan/block`, 'post', {
        block_num: 22,
        only_head: true
    })
})

test('should fetchBlockList', async () => {
    let {requestHelper, requestHelperSpy} = setUpRequestHelper({
        data: {
            blocks: [
                {
                    block_num: 1,
                    block_timestamp: 1000
                }
            ]
        }
    });
    (subscanApi as any)['requestHelper'] = requestHelper
    const blockList = await subscanApi.fetchBlockList('kusama', 1, 100)
    expect(blockList.length).toBe(1)
    expect(blockList[0]).toEqual({
        block_num: 1,
        block_timestamp: 1000
    })
    expect(requestHelperSpy).toHaveBeenCalledWith(`https://kusama.api.subscan.io/api/v2/scan/blocks`, 'post', {
        page: 1,
        row: 100
    })
})

describe('staking rewards', () => {

    const stakingRewardsList = {
        list: [
            {event_id: '123', amount: 10, block_timestamp: 223, extrinsic_index: '2223-4', extrinsic_hash: 'foo'},
            {event_id: '127', amount: 11, block_timestamp: 226, extrinsic_index: '2226-7', extrinsic_hash: 'bla'}
        ]
    }

    test('should fetchPoolStakingRewards', async () => {
        let {requestHelper, requestHelperSpy} = setUpRequestHelper({
            data: stakingRewardsList
        });
        (subscanApi as any)['requestHelper'] = requestHelper
        const poolStakingRewards = await subscanApi.fetchPoolStakingRewards('kusama', 'bla', 1, 100, 0)
        expect(poolStakingRewards.hasNext).toBeFalsy();
        expect(poolStakingRewards.list.length).toBe(2)
        expect(poolStakingRewards.list[0]).toEqual({
            event_id: '123',
            amount: BigNumber(10),
            block_timestamp: 223,
            block_num: '2223',
            hash: 'foo'
        })
        expect(poolStakingRewards.list[1]).toEqual({
            event_id: '127',
            amount: BigNumber(11),
            block_timestamp: 226,
            block_num: '2226',
            hash: 'bla'
        })
        expect(requestHelperSpy).toHaveBeenCalledWith(`https://kusama.api.subscan.io/api/scan/nomination_pool/rewards`, 'post', {
            row: 100,
            page: 0,
            address: 'bla',
            pool_id: 1
        })
        const poolStakingRewards2 = await subscanApi.fetchPoolStakingRewards('kusama', 'bla', 1, 2, 0)
        expect(poolStakingRewards2.hasNext).toBeTruthy();
    })


    test('should fetchStakingRewards', async () => {
        let {requestHelper, requestHelperSpy} = setUpRequestHelper({
            data: stakingRewardsList
        });
        (subscanApi as any)['requestHelper'] = requestHelper
        const stakingRewards = await subscanApi.fetchStakingRewards('kusama', 'bla', 100, 1, true, 1000, 2000)
        expect(stakingRewards.hasNext).toBeFalsy();
        expect(stakingRewards.list.length).toBe(2)
        expect(stakingRewards.list[0]).toEqual({
            event_id: '123',
            amount: BigNumber(10),
            block_timestamp: 223,
            block_num: '2223',
            hash: 'foo'
        })
        expect(stakingRewards.list[1]).toEqual({
            event_id: '127',
            amount: BigNumber(11),
            block_timestamp: 226,
            block_num: '2226',
            hash: 'bla'
        })
        expect(requestHelperSpy).toHaveBeenCalledWith(`https://kusama.api.subscan.io/api/scan/account/reward_slash`, 'post', {
            row: 100,
            page: 1,
            address: 'bla',
            'is_stash': true,
            block_range: '1000-2000'
        })
        const stakingRewards2 = await subscanApi.fetchStakingRewards('kusama', 'bla', 2, 2, true, 1000, 2000)
        expect(stakingRewards2.hasNext).toBeTruthy();
    })
})

test('should fetch accounts', async () => {
    let {requestHelper, requestHelperSpy} = setUpRequestHelper({
        data: {
            list: [
                {address: '123'},
                {address: '778'}
            ]
        }
    });
    (subscanApi as any)['requestHelper'] = requestHelper
    const accounts = await subscanApi.fetchAccounts('foo', 'polkadot')
    expect(accounts.length).toBe(2)
    expect(accounts[0]).toBe('123')
    expect(accounts[1]).toBe('778')
    expect(requestHelperSpy).toHaveBeenCalledWith(`https://polkadot.api.subscan.io/api/v2/scan/accounts`, 'post', {
        address: ['foo'],
        row: 100
    })

    requestHelper = setUpRequestHelper({
        data: {list: []}
    }).requestHelper;
    (subscanApi as any)['requestHelper'] = requestHelper
    const accounts2 = await subscanApi.fetchAccounts('foo', 'polkadot')
    expect(accounts2.length).toBe(1)
    expect(accounts2[0]).toBe('foo')
})

test('should fetchExtrinsics', async () => {
    let {requestHelper, requestHelperSpy} = setUpRequestHelper({
        data: {
            extrinsics: [
                {
                    extrinsic_hash: 'abc',
                    account_display: {address: 'foo'},
                    block_timestamp: 100,
                    block_num: 200,
                    call_module_function: 'swap',
                    call_module: 'dex'
                },
            ]
        }
    });
    (subscanApi as any)['requestHelper'] = requestHelper
    const extrinsics = await subscanApi.fetchExtrinsics('polkadot', 'bla', 100, 0, 100, 200, false)
    expect(extrinsics.list.length).toBe(1)
    expect(extrinsics.hasNext).toBeFalsy();
    expect(extrinsics.list[0]).toEqual(
        {
            hash: 'abc',
            account: 'foo',
            block_timestamp: 100,
            block_num: 200,
            functionName: 'swap',
            callModule: 'dex'
        }
    )
    expect(requestHelperSpy).toHaveBeenCalledWith(`https://polkadot.api.subscan.io/api/v2/scan/extrinsics`, 'post', {
        row: 100,
        page: 0,
        address: 'bla',
        success: true,
        block_range: `100-200`
    })
})


test('should fetchTransfers', async () => {
        let {requestHelper, requestHelperSpy} = setUpRequestHelper({
            data: {
                transfers: [
                    {
                        from: 'alice',
                        to: 'bob',
                        hash: '1',
                        asset_symbol: 'dot',
                        amount: 100,
                        decimals: 18,
                        block_num: 10,
                        block_timestamp: 200,
                    },
                    {
                        from: 'bob',
                        to: 'alice',
                        hash: '1',
                        asset_symbol: 'btc',
                        amount: 1,
                        decimals: 18,
                        block_num: 10,
                        block_timestamp: 200,
                    },
                    {
                        from: 'alice',
                        to: 'charley',
                        hash: '2',
                        asset_symbol: 'usdt',
                        amount: 100,
                        decimals: 10,
                        block_num: 11,
                        block_timestamp: 300,
                    },
                    {
                        from: 'charley',
                        to: 'alice',
                        hash: '3',
                        asset_symbol: 'usdc',
                        amount: 99,
                        decimals: 10,
                        block_num: 12,
                        block_timestamp: 300,
                    },
                    {
                        from: 'charley',
                        to: 'alice',
                        hash: '3',
                        asset_symbol: 'usdc',
                        amount: 7,
                        decimals: 10,
                        block_num: 12,
                        block_timestamp: 300,
                    },
                ]
            }
        });
        (subscanApi as any)['requestHelper'] = requestHelper
        const transfers = await subscanApi.fetchTransfers('polkadot', 'alice', (a) => a === 'alice', 100, 4, 200, 300, false)
        expect(transfers.list.length).toBe(1)
        expect(transfers.list[0]).toEqual(
            {
                "1": {
                    "dot": {"amount": -100, "from": "alice", "to": "bob", "block": 10, "timestamp": 200, "hash": "1"},
                    "btc": {"amount": 1, "to": "alice", "from": "bob", "block": 10, "timestamp": 200, "hash": "1"}
                },
                "2": {
                    "usdt": {
                        "amount": -100,
                        "from": "alice",
                        "to": "charley",
                        "block": 11,
                        "timestamp": 300,
                        "hash": "2"
                    }
                },
                "3": {"usdc": {"amount": 106, "to": "alice", "from": "charley", "block": 12, "timestamp": 300, "hash": "3"}}
        })
})