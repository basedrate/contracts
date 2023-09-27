const { run } = require("hardhat");


//________________________________________________________________________

const STARTTIME = 1695837600;
const TEAM_DISTRIBUTOR = "0xD8363377cb54E82d40D0EC44D01d366E4b15eA0b";
const BRATE = "0xd260115030b9fB6849da169a01ed80b6496d1e99";
const BSHARE = "0x608d5401d377228E465Ba6113517dCf9bD1f95CA";
const BBOND = "0xc9210FF20ebBAB41dBecF9D5Bf4D1d2ea15E986c";
const COMMUNITY = "0x514cE5da2Dc5883e40625b6e182dB437D87941A7";
const BASEHAREREWARDPOOL = "0xbCE487e8BAe42370536544ed533Bada46bCCF6Ef";
const BOARDROOM = "0x60268690851a4881d1e1660fA2b565a316c9bD2b";
const TREASURY = "0xdfa73618683587E1B72019546E0DD866B2Ed6Fb4";
const PRESALEDISTRIBUTOR = "0xeD7D1EE01DBd586A7886A2f60a6E395D72818dF0";
const UI_HELPER = "0xc5776b5f7c7B207F703f6F42489EdCfAc94CE906"
const ORACLE = "0x371c1605e5ddD2588d920df146484f6037e358C7";
const BRATE_ETH_LP = "0x8071175D8fe0055048B0654B10c88CAD5D2D1F19";
const sharePerSecond = 0.00011574074 * 1e18;

const main = async () => {

  await run("verify:verify", {
    address: TEAM_DISTRIBUTOR,
  });
  await run("verify:verify", {
    address: BRATE,
  });
  await run("verify:verify", {
    address: BBOND,
  });
  await run("verify:verify", {
    address: COMMUNITY,
  });
  await run("verify:verify", {
    address: BOARDROOM,
  });
  await run("verify:verify", {
    address: TREASURY,
  });
  await run("verify:verify", {
    address: UI_HELPER,
  });

  await run("verify:verify", {
    address: BSHARE,
    constructorArguments: [BRATE],
  });

  await run("verify:verify", {
    address: PRESALEDISTRIBUTOR,
    constructorArguments: [STARTTIME,BRATE,BSHARE],
  });

  await run("verify:verify", {
    address: ORACLE,
    constructorArguments: [BRATE_ETH_LP],
  });
  await run("verify:verify", {
    address: BASEHAREREWARDPOOL,
    constructorArguments: [BSHARE,COMMUNITY,TEAM_DISTRIBUTOR,1000,1000,sharePerSecond,STARTTIME],
  });


};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
