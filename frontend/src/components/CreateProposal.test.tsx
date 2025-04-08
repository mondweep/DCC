import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateProposal from './CreateProposal';
import { Web3Context } from '../contexts/Web3Context';

import { ethers } from 'ethers';

type MockGovernanceContract = {
  interface: {
    encodeFunctionData: jest.Mock<any, any, any>;
  };
  estimateGas: jest.Mock<any, any, any>;
  callStatic: jest.Mock<any, any, any>;
  [Symbol.iterator]: jest.Mock<any, any, any>;
  methods: {
    createProposal: jest.Mock<any, any, any>;
  };
} | null;

const mockWeb3ContextValue = {
  provider: null,
  signer: null,
  account: '0x1234567890123456789012345678901234567890',
  isMember: false,
  connectWallet: jest.fn(),
  checkMembershipStatus: jest.fn(),
  disconnectWallet: jest.fn(),
  membershipContract: null,
  governanceContract: null as MockGovernanceContract,
  incomeManagementContract: null,
  paymentContract: null,
};

describe('CreateProposal Component', () => {
  it('renders the component', () => {
    render(
      <Web3Context.Provider value={mockWeb3ContextValue}>
        <CreateProposal />
      </Web3Context.Provider>
    );
    expect(screen.getByText('Create Proposal')).toBeInTheDocument();
  });

  it('updates the proposal text state when the textarea value changes', () => {
    render(
      <Web3Context.Provider value={mockWeb3ContextValue}>
        <CreateProposal />
      </Web3Context.Provider>
    );
    const textareaElement = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textareaElement, { target: { value: 'Test proposal' } });
    expect(textareaElement.value).toBe('Test proposal');
  });

  it('calls the createProposal function when the submit button is clicked', () => {
    render(
      <Web3Context.Provider value={mockWeb3ContextValue}>
        <CreateProposal />
      </Web3Context.Provider>
    );
    const textareaElement = screen.getByRole('textbox');
    fireEvent.change(textareaElement, { target: { value: 'Test proposal' } });
    const submitButton = screen.getByText('Submit Proposal');
    fireEvent.click(submitButton);
    expect(mockWeb3ContextValue.governanceContract?.methods.createProposal).toHaveBeenCalledWith('Test proposal');
  });
});