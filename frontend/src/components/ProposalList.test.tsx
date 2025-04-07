import React from 'react';
import { render, screen } from '@testing-library/react';
import ProposalList from './ProposalList';
import { Web3Context } from '../contexts/Web3Context';

const mockWeb3ContextValue = {
  provider: null,
  signer: null,
  account: '0x1234567890123456789012345678901234567890',
  isMember: true,
  connectWallet: jest.fn(),
  checkMembershipStatus: jest.fn(),
  disconnectWallet: jest.fn(),
  membershipContract: null,
  governanceContract: {
    methods: {
      proposals: jest.fn((index: number) => ({
        call: jest.fn(() => ({
          id: index,
          proposer: '0x123',
          text: `Proposal ${index}`,
          votes: 0,
          voted: false,
        })),
      })),
      proposalCount: jest.fn(() => ({
        call: jest.fn(() => 3),
      })),
    },
  } as any,
  incomeManagementContract: null,
  paymentContract: null,
};

describe('ProposalList Component', () => {
  it('renders the component', async () => {
    render(
      <Web3Context.Provider value={mockWeb3ContextValue}>
        <ProposalList />
      </Web3Context.Provider>
    );

    // Wait for the proposals to load
    await screen.findByText('Proposal 0');
    expect(screen.getByText('Proposal 0')).toBeInTheDocument();
    expect(screen.getByText('Proposal 1')).toBeInTheDocument();
    expect(screen.getByText('Proposal 2')).toBeInTheDocument();
  });
});