// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ProofPayEscrow
/// @notice Escrows ETH for sharded AI inference jobs and releases payment only
///         after the coordinator cryptographically verifies execution.
contract ProofPayEscrow {
    address public immutable coordinator;

    struct Job {
        address submitter;
        uint256 amount;
        address[] operators;
        bool settled;
    }

    mapping(string => Job) private jobs;

    event JobSubmitted(string indexed jobId, address indexed submitter, uint256 amount);
    event JobSettled(string indexed jobId, bool verified);

    error NotCoordinator();
    error JobAlreadyExists();
    error JobNotFound();
    error AlreadySettled();
    error NoOperators();
    error MustSendETH();

    constructor(address _coordinator) {
        coordinator = _coordinator;
    }

    modifier onlyCoordinator() {
        if (msg.sender != coordinator) revert NotCoordinator();
        _;
    }

    /// @notice Submitter locks ETH for a job before execution begins.
    /// @param jobId  Unique job identifier (e.g. "job_a1b2c3d4")
    /// @param operators  Wallet addresses of participating operators
    function submitJob(string calldata jobId, address[] calldata operators) external payable {
        if (msg.value == 0) revert MustSendETH();
        if (jobs[jobId].submitter != address(0)) revert JobAlreadyExists();
        if (operators.length == 0) revert NoOperators();

        address[] memory ops = new address[](operators.length);
        for (uint256 i = 0; i < operators.length; i++) {
            ops[i] = operators[i];
        }

        jobs[jobId] = Job({
            submitter: msg.sender,
            amount: msg.value,
            operators: ops,
            settled: false
        });

        emit JobSubmitted(jobId, msg.sender, msg.value);
    }

    /// @notice Called by the coordinator after proof verification.
    ///         Distributes ETH to operators on success, refunds submitter on failure.
    /// @param jobId     The job to settle
    /// @param verified  True if proof verified; false if verification failed
    function settleJob(string calldata jobId, bool verified) external onlyCoordinator {
        Job storage job = jobs[jobId];
        if (job.submitter == address(0)) revert JobNotFound();
        if (job.settled) revert AlreadySettled();

        job.settled = true;
        uint256 amount = job.amount;

        if (verified) {
            uint256 n = job.operators.length;
            uint256 share = amount / n;
            uint256 remainder = amount - share * n;

            for (uint256 i = 0; i < n; i++) {
                payable(job.operators[i]).transfer(share);
            }
            // dust goes to first operator
            if (remainder > 0) {
                payable(job.operators[0]).transfer(remainder);
            }
        } else {
            payable(job.submitter).transfer(amount);
        }

        emit JobSettled(jobId, verified);
    }

    /// @notice Returns details for a job.
    function getJob(string calldata jobId)
        external
        view
        returns (
            address submitter,
            uint256 amount,
            address[] memory operators,
            bool settled
        )
    {
        Job storage job = jobs[jobId];
        return (job.submitter, job.amount, job.operators, job.settled);
    }
}
