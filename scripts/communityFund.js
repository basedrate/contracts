const { ethers } = require("hardhat");
const {
  setBalance,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const PoolABI =
  require("../artifacts/contracts/aerodrome/Pool.sol/Pool.json").abi;
const GaugeABI =
  require("../artifacts/contracts/aerodrome/gauges/Gauge.sol/Gauge.json").abi;
const ERC20ABI =
  require("@openzeppelin/contracts/build/contracts/ERC20.json").abi;
const { utils, provider } = ethers;

const BRATE = "0xd260115030b9fB6849da169a01ed80b6496d1e99";
const BSHARE = "0x608d5401d377228E465Ba6113517dCf9bD1f95CA";
const AERO = "0x940181a94A35A4569E4529A3CDfB74e38FD98631";
const wUSDR = "0x9483ab65847a447e36d21af1cab8c87e9712ff93";
const USDbC = "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca";
const WETH = "0x4200000000000000000000000000000000000006";
const COMMUNITY_FUNDV2 = "0x3A462BC5525eEC6fF01e934486BFd874CDbF01cA";
const vAMMWETHUSDbC = "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0";
const vAMMWETHBSHARE = "0xF909B746Ce48dede23c09B05B3fA27754E768Bd2";
const vAMMAEROUSDbC = "0x2223F9FE624F69Da4D8256A7bCc9104FBA7F8f75";
const vAMMWUSDRUSDbC = "0x3Fc28BFac25fC8e93B5b2fc15EfBBD5a8aA44eFe";
const sAMMWETHBRATE = "0x8071175D8fe0055048B0654B10c88CAD5D2D1F19";

const vAMMWETHUSDbC_Gauge = "0xeca7Ff920E7162334634c721133F3183B83B0323";
const vAMMAEROUSDbC_Gauge = "0x9a202c932453fB3d04003979B121E80e5A14eE7b";
const vAMMWUSDRUSDbC_Gauge = "0xF64957C35409055776C7122AC655347ef88eaF9B";

let deployer;
let communityFund;

const BRATEContract = new ethers.Contract(BRATE, ERC20ABI, provider);
const BSHAREContract = new ethers.Contract(BSHARE, ERC20ABI, provider);
const WETHContract = new ethers.Contract(WETH, ERC20ABI, provider);
const USDbCContract = new ethers.Contract(USDbC, ERC20ABI, provider);
const AEROContract = new ethers.Contract(AERO, ERC20ABI, provider);
const WUSDRContract = new ethers.Contract(wUSDR, ERC20ABI, provider);

const setAddresses = async () => {
  console.log("\n*** SETTING ADDRESSES ***");
  if (network.name === "localhost" || network.name === "hardhat") {
    deployer = await ethers.getImpersonatedSigner(
      "0xADF9152100c536e854e0ed7A3E0E60275CeF7E7d"
    );
  } else {
    [deployer] = await ethers.getSigners();
  }
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address}`);
  console.log("Deployer Balance:", utils.formatEther(balance));
};

const attachContracts = async () => {
  const CommunityFundV2 = await ethers.getContractFactory(
    "CommunityFundV2",
    deployer
  );
  communityFund = CommunityFundV2.attach(COMMUNITY_FUNDV2);
  console.log(`CommunityFundV2 attached to ${communityFund.address}`);
};

const getSwapFees = async (pools) => {
  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i];
    const poolContract = new ethers.Contract(pool, PoolABI, provider);
    console.log(`\n CLAIMING ${await poolContract.symbol()}`);
    const [claimableRewardPool0, claimableRewardPool1] = await poolContract
      .connect(COMMUNITY_FUNDV2)
      .callStatic.claimFees();
    const [token0, token1] = await poolContract.tokens();
    const token0Contract = new ethers.Contract(token0, ERC20ABI, provider);
    const token1Contract = new ethers.Contract(token1, ERC20ABI, provider);
    const decimals0 = await token0Contract.decimals();
    const decimals1 = await token1Contract.decimals();
    const symbol0 = await token0Contract.symbol();
    const symbol1 = await token1Contract.symbol();
    console.log(utils.formatUnits(claimableRewardPool0, decimals0), symbol0);
    console.log(utils.formatUnits(claimableRewardPool1, decimals1), symbol1);
  }
};

const claimSwapFees = async (token) => {
  const poolContract = new ethers.Contract(token, PoolABI, provider);
  const [token0, token1] = await poolContract.tokens();
  const token0Contract = new ethers.Contract(token0, ERC20ABI, provider);
  const token1Contract = new ethers.Contract(token1, ERC20ABI, provider);
  const decimals0 = await token0Contract.decimals();
  const decimals1 = await token1Contract.decimals();
  const symbol0 = await token0Contract.symbol();
  const symbol1 = await token1Contract.symbol();
  console.log(
    "Balance Before:",
    utils.formatUnits(
      await token0Contract.balanceOf(communityFund.address),
      decimals0
    ),
    symbol0
  );
  console.log(
    "Balance Before:",
    utils.formatUnits(
      await token1Contract.balanceOf(communityFund.address),
      decimals1
    ),
    symbol1
  );
  tx = await communityFund.getExternalSwapFees(token);
  receipt = await tx.wait();
  console.log(
    "Balance After:",
    utils.formatUnits(
      await token0Contract.balanceOf(communityFund.address),
      decimals0
    ),
    symbol0
  );
  console.log(
    "Balance After:",
    utils.formatUnits(
      await token1Contract.balanceOf(communityFund.address),
      decimals1
    ),
    symbol1
  );
};

const multiClaimSwapFees = async (pools) => {
  const BRATEBalanceBefore = await BRATEContract.balanceOf(
    communityFund.address
  );
  const BSHAREBalanceBefore = await BSHAREContract.balanceOf(
    communityFund.address
  );
  const USDbCBalanceBefore = await USDbCContract.balanceOf(
    communityFund.address
  );
  const WUSDRBalanceBefore = await WUSDRContract.balanceOf(
    communityFund.address
  );
  const WETHBalanceBefore = await WETHContract.balanceOf(communityFund.address);
  const AEROBalanceBefore = await AEROContract.balanceOf(communityFund.address);

  const data = pools.map((pool) =>
    communityFund.interface.encodeFunctionData("getExternalSwapFees", [pool])
  );
  tx = await communityFund.multicall(data);
  receipt = await tx.wait();
  const BRATEBalanceAfter = await BRATEContract.balanceOf(
    communityFund.address
  );
  const BSHAREBalanceAfter = await BSHAREContract.balanceOf(
    communityFund.address
  );
  const USDbCBalanceAfter = await USDbCContract.balanceOf(
    communityFund.address
  );
  const WUSDRBalanceAfter = await WUSDRContract.balanceOf(
    communityFund.address
  );
  const WETHBalanceAfter = await WETHContract.balanceOf(communityFund.address);
  const AEROBalanceAfter = await AEROContract.balanceOf(communityFund.address);

  console.log(
    "BRATE claimed:",
    utils.formatUnits(
      BRATEBalanceAfter.sub(BRATEBalanceBefore),
      await BRATEContract.decimals()
    )
  );
  console.log(
    "BSHARE claimed:",
    utils.formatUnits(
      BSHAREBalanceAfter.sub(BSHAREBalanceBefore),
      await BSHAREContract.decimals()
    )
  );
  console.log(
    "USDbC claimed:",
    utils.formatUnits(
      USDbCBalanceAfter.sub(USDbCBalanceBefore),
      await USDbCContract.decimals()
    )
  );
  console.log(
    "WUSDR claimed:",
    utils.formatUnits(
      WUSDRBalanceAfter.sub(WUSDRBalanceBefore),
      await WUSDRContract.decimals()
    )
  );
  console.log(
    "WETH claimed:",
    utils.formatUnits(
      WETHBalanceAfter.sub(WETHBalanceBefore),
      await WETHContract.decimals()
    )
  );
  console.log(
    "AERO claimed:",
    utils.formatUnits(
      AEROBalanceAfter.sub(AEROBalanceBefore),
      await AEROContract.decimals()
    )
  );
};

const depositInGauge = async (token, gauge) => {
  const GaugeContract = new ethers.Contract(gauge, GaugeABI, provider);
  const TokenContract = new ethers.Contract(token, ERC20ABI, provider);

  console.log("\n*** APPROVING TOKENS TO GAUGE ***");
  tx = await communityFund.sendCustomTransaction(
    token,
    0,
    "approve(address,uint256)",
    utils.defaultAbiCoder.encode(
      ["address", "uint256"],
      [gauge, ethers.constants.MaxUint256]
    )
  );
  receipt = await tx.wait();
  //   console.log(await TokenContract.allowance(communityFund.address, gauge));
  console.log("\n*** DEPOSITING TO GAUGE ***");
  const balanceBefore = await TokenContract.balanceOf(communityFund.address);
  tx = await communityFund.sendCustomTransaction(
    gauge,
    0,
    "deposit(uint256)",
    utils.defaultAbiCoder.encode(["uint256"], [balanceBefore])
  );
  receipt = await tx.wait();
  const balanceAfter = await TokenContract.balanceOf(communityFund.address);
  console.log({ balanceBefore, balanceAfter });
};

const multipleDepositInGauge = async (tokens, gauges) => {
  let data = tokens.map((token, i) =>
    communityFund.interface.encodeFunctionData("sendCustomTransaction", [
      token,
      0,
      "approve(address,uint256)",
      utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [gauges[i], ethers.constants.MaxUint256]
      ),
    ])
  );
  tx = await communityFund.multicall(data);
  receipt = await tx.wait();
  tokens.map(async (token, i) => {
    const tokenContract = new ethers.Contract(token, ERC20ABI, provider);
    console.log(
      await tokenContract.allowance(communityFund.address, gauges[i])
    );
  });
  data = await Promise.all(
    tokens.map(async (token, i) => {
      const tokenContract = new ethers.Contract(token, ERC20ABI, provider);
      const balance = await tokenContract.balanceOf(communityFund.address);
      return communityFund.interface.encodeFunctionData(
        "sendCustomTransaction",
        [
          gauges[i],
          0,
          "deposit(uint256)",
          utils.defaultAbiCoder.encode(["uint256"], [balance]),
        ]
      );
    })
  );
  tx = await communityFund.multicall(data);
  receipt = await tx.wait();
};

const claimFromGauge = async (gauge) => {
  const GaugeContract = new ethers.Contract(gauge, GaugeABI, provider);
  console.log(
    "Available rewards:",
    utils.formatEther(await GaugeContract.earned(communityFund.address))
  );
  const balanceBefore = await AEROContract.balanceOf(communityFund.address);
  tx = await communityFund.sendCustomTransaction(
    gauge,
    0,
    "getReward(address)",
    utils.defaultAbiCoder.encode(["address"], [communityFund.address])
  );
  receipt = await tx.wait();
  const balanceAfter = await AEROContract.balanceOf(communityFund.address);
  console.log({ balanceBefore, balanceAfter });
};

const getGaugeRewards = async (gauges) => {
  for (let i = 0; i < gauges.length; i++) {
    const gauge = gauges[i];
    const gaugeContract = new ethers.Contract(gauge, GaugeABI, provider);
    const stakingToken = await gaugeContract.stakingToken();
    const stakingTokenContract = new ethers.Contract(
      stakingToken,
      ERC20ABI,
      provider
    );
    console.log(`${await stakingTokenContract.symbol()} pool`);
    const rewards = await gaugeContract.earned(communityFund.address);
    console.log("AERO Rewards:", utils.formatEther(rewards));
  }
};

const main = async () => {
  await setAddresses();
  await attachContracts();
  //   await getSwapFees([
  //     sAMMWETHBRATE,
  //     vAMMWETHBSHARE,
  //     vAMMAEROUSDbC,
  //     vAMMWUSDRUSDbC,
  //     vAMMWETHUSDbC,
  //   ]);
  await multiClaimSwapFees([
    sAMMWETHBRATE,
    vAMMWETHBSHARE,
    vAMMAEROUSDbC,
    vAMMWUSDRUSDbC,
    vAMMWETHUSDbC,
  ]);
  //   await claimSwapFees(sAMMWETHBRATE);
  //   await claimSwapFees(vAMMWETHBSHARE);
  //   await claimSwapFees(vAMMWETHBSHARE);
  //   await claimSwapFees(vAMMWETHBSHARE);
  //   await depositInGauge(vAMMWUSDRUSDbC, vAMMWUSDRUSDbC_Gauge);
  //   await time.increase(86400);
  //   await claimFromGauge(vAMMWUSDRUSDbC_Gauge);

  //   await multiClaimFees([
  //     sAMMWETHBRATE,
  //     vAMMWETHBSHARE,
  //     vAMMAEROUSDbC,
  //     vAMMWETHUSDbC,
  //     vAMMWUSDRUSDbC,
  //   ]);

  //   await multipleDepositInGauge(
  //     [vAMMAEROUSDbC, vAMMWUSDRUSDbC, vAMMWETHUSDbC],
  //     [vAMMAEROUSDbC_Gauge, vAMMWUSDRUSDbC_Gauge, vAMMWETHUSDbC_Gauge]
  //   );
  //   await time.increase(86400);
  //   await getGaugeRewards([
  //     vAMMAEROUSDbC_Gauge,
  //     vAMMWUSDRUSDbC_Gauge,
  //     vAMMWETHUSDbC_Gauge,
  //   ]);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
