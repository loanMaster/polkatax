import { TransferMerger } from './transfer-merger'
import { Transfers } from '../model/transfer'
import {test,expect, describe, beforeEach } from '@jest/globals';

describe('TransferMerger', () => {
    let merger: TransferMerger

    beforeEach(() => {
        merger = new TransferMerger()
    })

    test('should merge two Transfers correctly', () => {
        const target: Transfers = {
            'tx1': {
                'DOT': { from: 'alice', to: 'bob', amount: 100, block: 1, timestamp: 1000, functionName: 'transfer' }
            }
        } as unknown as Transfers

        const source: Transfers = {
            'tx1': {
                'DOT': { from: 'alice', to: 'bob', amount: 50, block: 1, timestamp: 1000, functionName: 'transfer' },
                'KSM': { from: 'carol', to: 'dave', amount: 25, block: 2, timestamp: 2000, functionName: 'transfer' }
            },
            'tx2': {
                'DOT': { from: 'eve', to: 'frank', amount: 75, block: 3, timestamp: 3000, functionName: 'transfer' }
            }
        } as unknown as Transfers

        const result = merger.merge(target, source)

        expect(result).toEqual({
            'tx1': {
                'DOT': { from: 'alice', to: 'bob', amount: 150, block: 1, timestamp: 1000, functionName: 'transfer' },
                'KSM': { from: 'carol', to: 'dave', amount: 25, block: 2, timestamp: 2000, functionName: 'transfer' }
            },
            'tx2': {
                'DOT': { from: 'eve', to: 'frank', amount: 75, block: 3, timestamp: 3000, functionName: 'transfer' }
            }
        })
    })

    test('should handle empty target gracefully', () => {
        const target: Transfers = {}

        const source: Transfers = {
            'tx1': {
                'DOT': { from: 'alice', to: 'bob', amount: 100, block: 1, timestamp: 1000, functionName: 'transfer' }
            }
        } as unknown as Transfers

        const result = merger.merge(target, source)

        expect(result).toEqual(source)
    })

    test('should create missing token entries with amount 0 before adding', () => {
        const target: Transfers = {
            'tx1': {}
        }

        const source: Transfers = {
            'tx1': {
                'DOT': { from: 'alice', to: 'bob', amount: 50, block: 1, timestamp: 1000, functionName: 'transfer' }
            }
        } as unknown as Transfers

        const result = merger.merge(target, source)

        expect(result['tx1']['DOT'].amount).toBe(50)
    })
})