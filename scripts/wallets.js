const { ethers } = require("hardhat");

// BATCH 1 ----------------------------------------------------------------------------
const addressesBatch1 = [
"0x35745391d5355F659a3fE6248cf6eD84494a3be6",
"0x1463759b046963309e1E2f996a48A9E4B612Afcd",
"0x170E3338eB582767E6f23ca4fb7014CA09935197",
"0xF46288c820C6CC64e09a59b59049Eff4C9fa6B82",
"0xf3e3A179FD07488E1883283C091B67E823c42dDa",
"0x9e3E0e63dc0E02420ea0c57af094Ac6dA424240e",
"0x6111fD9176947F92B498FF3ceC592A6d01aB7614",
"0x257d1885601Bd92B98d6ecaBFb62f7692722e694",
"0x5A437400eF10265aAeDAd47CD3520C885D11514e",
"0xf2b0E390aD881BB8a86777591936c2B56DD1F025",
"0xa1bc8Ba7013E33Ee5D7101a8B14482FCb718Fc52",
"0x3Cb157b798a9d78E686639AAcB42680628BD2a2d",
"0xEC4C15765C88090d6fD5f11251700ffF6Be12b4c",
"0x625428D5A184B54f619186E920d4F830e598B360",
"0xb98E371D6f9EC306F537e329183B05192B112Dd7",
"0x399Ca8F929439855cfFE10a76Cbe7CC01F2497c2",
"0xc2593D926df9B4E690Eae57866641862b3CD6265",
"0x499D34f33F54a0Fd4E93671425ae11d44F9db5Ac",
"0x90Fd1Ad4d40FdE85Edc15EA56d82AFF7e3c116a6",
"0xCc556Fd968eb159C5C740C9Ad94948194F12424a",
"0x9d137f55A278Cd591C1Fa6aAC92643E4CCFC4778",
"0xaEDb5CB55564712db6932ed25989dBCb980AA0c3",
"0x283c4C08Df792484f0417564BF14BE0629b4fbF7",
"0xAAb84064424Cd696aF210Bc135FE26077e0AadcE",
"0x54AB7730a09513b9bC30004C6Bfdfe5bbB8aA886",
"0xf1fc88b54eDCE8ce37644C25d35b347A583cf1ea",
"0xaf9E5AbE565214c7c72CA93C68192a8b96f11d16",
"0x60dAcD1B401232D8D4ABcF51D2BA88c4e7Fba2C3",
"0xA6346E9426Ea2a093AF0Bf5B119651DAbd536946",
"0xF778Ad38e2e458D8Ceb2400D8eD80A5579985CcB",
"0x7457BF61DA22991eFE53DeC2deB4d33f95178c87",
"0x12E3465Db80D4585470d73872f736A9E2F6F7EDA",
"0xbb461a10C52D6d3e1C963adD2a3D8ee05E2fB8A4",
"0xccC2f2b0bdd423B68bBee222Ac97D0d202a4D017",
"0x1Bd498Fa1e9eAB22a9f21bCaf0c5B0E62986d736",
"0xDD690c0094F737645b5ce5f1bE54d4918b56E827",
"0x287e51B33f3fcFdd86Fc6Ff4103E9E468AACa1b3",
"0x19254b9feb47315CD66afecA586211A2e5AAAF7A",
"0xa7c542018a9ED6028A38DAB7EA0fBc89AA240E19",
"0x5e3C841ECCa354b3d84747b8448ebf6F09fd0267",
"0xCebaaC5075DcBCD4129aB49Cf1357986e3874697"
];

const limitsBatch1 = [
  ethers.utils.parseEther("0.01"),
  ethers.utils.parseEther("0.01"),
  ethers.utils.parseEther("0.01"),
  ethers.utils.parseEther("0.01"),
  ethers.utils.parseEther("0.01"),
  ethers.utils.parseEther("0.01"),
  ethers.utils.parseEther("0.01"),
  ethers.utils.parseEther("0.01"),
  ethers.utils.parseEther("0.01"),
  ethers.utils.parseEther("0.01"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.1")
  
];

// BATCH 2 ----------------------------------------------------------------------------
const addressesBatch2 = [
"0xDdf5D5936F5a607b27d6f99eab9E25A99ceCe79C",
"0x7641B221b008817D966E89e2310F7c51A3e7B448",
"0x821456D6104CB9eeD3A4Ad8216Ef63953062cB49",
"0x5b3427b93B0122E1f2FC69793ccF0ac52cE9A3bc",
"0x425c14B988267874aE61eDcA7C85235557Eff671",
"0x65dD4fe2272D0dDA5A341c1bEB185fe97cA6666F",
"0xeE528c22905b07FA54A320363c7adB605940Bd8d",
"0xD51bF25641525B6b12E747b1985A8A8D29Cc1247",
"0x40AeEFF6Ca5dBB50418040Cd373782f258f4a316",
"0x041B1b0C40abA8fd33a0BA41959f0acd49c41992",
"0xA02FAbBFEe04918A95F8098e282F91E2Fbb8026b",
"0x2549692A53772D1f7765E4Bb73dC7D90347b12FB",
"0xcD51bB6E21a22A612ABf793A59b6CD2e0a8b10d1",
"0x40586600A136652F6D0a6cc6A62b6bd1beF7AE9A",
"0x965961DC613b7C1912f9a9F660CcE417E058C48c",
"0x40602FC8343C7a3AA15d350D9d291486A364E0aD",
"0x5f3Fd3EAD9f5FA9b48c05122928BED607975E4BD",
"0x9B3755a6C24681147E349CE140063c292d5666DC",
"0x245e6466cD1562DF7A784A03623C9CB4a63a47d4",
"0x060a7b421dD264CeBA189368C956f2d38eD9A4f7",
"0xAAD0Fe59733f23c4793958886059E3d445AeD4B3",
"0x28D9C9E1BD5Bab742feaf1a5E7c1AdC3063916De",
"0xa26f68aC2A90e6363E64Bc55960f2D75d2dDf730",
"0x64a05b7a0F4e20745ea270783AF370D76A20537c",
"0x77b3a67cCEDCfeBe4f6099a319BdEF2DdA99B69d",
"0xc5A35c6c7dBbE66D26bA607AAde7964634bff62F",
"0xc2bCcc4de746277Ae758dC3adab61A533De10077",
"0x4B38466EA1E72cB6c2912B5e669C1570adB8ac7a",
"0xd36BC0A6c4882940D7cF3940bC521553A62A1681",
"0x907B58e388a1a580F988609EEbC43f88097fA62c",
"0x32e6565664af93E86e21a91264ee3Fc591Ea526c",
"0xc74f46e2dBdEc674aD71692c53522663A50696Ca",
"0x73716c342d5DD8F57e944414B35a507FA8b28570",
"0x216439D224bd425d760bF1B3963f2C906B140fCB",
"0xb2dF29dDb8B1E9eC01Faba4887B0E3260f6857D9",
"0xC7f8C77064c5C3100975d72734fc0D8A5D4D5f55",
"0x258A882C2deE60FB6CFD6093038054F248Df4b04",
"0xdbEC81b4Eab0B5234dBd9ff7c456BF750d7a9086",
"0x94D17a58859Ee847b9170Bf08Df271fF336d440D",
"0xBC25EfdbD2c810eF689d68c7e966385De5138060",
"0x0d005cd79071BA89A3765F82a35943E06F0472D4"
];

const limitsBatch2 = [
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.1"),
ethers.utils.parseEther("0.12"),
ethers.utils.parseEther("0.12")
];

// BATCH 3 ----------------------------------------------------------------------------
const addressesBatch3 = [
"0x37e014215902BA306dA13464A613F2E38578A6d0",
"0x7094072f97d04c0784fFB95677c52c605254152D",
"0xd780B0C4F1e0dD3B2bC41749389893a9f79d320e",
"0xf640288A25f920ef4579E2C28B28f9552a70C689",
"0x6A24d5689F57713E0f2B5C75B101005575dB7e63",
"0xD6605f6580ee49675ed707640822d2E42D03EF77",
"0x45eEB7338D4cA87F312e357B28f9d72d22705E6f",
"0xe3246362C59c0bD53732b4aA6af7766E87c06799",
"0x74B29bED05623CbE43FEaF22F3B862c800640c77",
"0x0f6080D6bBd5d467Ca64EA651223Fc8313F2B179",
"0x5062E4f306CdF479bDE1344715F92F6F1429a151",
"0x5fc9EBB43b04E1feC7603bA67A9D18194381C63e",
"0x7dad3FF6D53fDA7224bB60cbf1BE7Ed34E6759f7",
"0xCF3911B407380DdC8Da0A066C69165AC3F979435",
"0x9F985925a3303667238Fe48E9DC5482aB451b5D0",
"0x0c162fC43b95777829306C1Ea150F5A1AD2AFa2f",
"0x140e7AAB562241Ff022e3A366D27AC007AB51124",
"0x1C3Ff8F2BA1D6EbA136b0A0e3282d64bd1307588",
"0x1043307d71BAFEC3dcdc51C146E88F36ceFd82eF",
"0x4Be2EE9d1CF949DEc169352A635A8436ad9F03Fb",
"0x4f65C02864F7c4D1C80e0CF34da3BE04DCA684F5",
"0x9868F17346Cdf395B9b293884ce3a66b83C01Aa6",
"0xDC9029AdEE8fE4C2cedFD2E482aFdd2558369036",
"0x98FBe5f1f8B768fD236B4498f96977D51cbF3e49",
"0x399BcC7439a3Fe74F198afb4656347472DB90721",
"0x78815067c3926cc33F7790d87460BEC779F42d4D",
"0xE36cCA46090B333e2cae2eAdE544BBbE2d5F3633",
"0x2a7f97640728f67033ed6E549B678feb23CF123D",
"0xf2c753F049A8cd75DF2c7deFEe8fa224E5eAA1aA",
"0xC202d94CbD66Fb7Ec7cd3216b1422F40c31e8aF4",
"0xb8E5a4Fe4c8E36EFfB32d4E559743fc39817189b",
"0xB0CED040dbE6E8CF3A3aa3E0b7E989b63cD56539",
"0x8D0a4d510f370fA66434ce0b666cCb2cfF6AC8B6",
"0x3a26C77cFDB4B0429eAC0FF38E4a807281E6d385",
"0xeF71c8EdA2AF16660331Ebb512ba371d4F7b75ab",
"0x0309146E7b8BAeFA23F193632eF74602768Af954",
"0xBD6209e5ed99E0d41A5E41f13574Ca06acFD344c",
"0x68a02f562d36aC031d4E3a367DA69f79eDE0976d",
"0x412d653F60E55A9f31ceabC02370d24ce5D09667",
"0x88852c87Ef4E148c1050A4BDe1512372960fd623",
"0x8c533Bd3A6096E4C067408FbB1918AeA9ee30825",
"0xcA7eABC07028A03c9cD05a48cDbEd400eB8C5409",
"0x919F69F0cc187a9B0b8c2AaFCF4968928D40cE90",
"0x77aDa9CDcC8094afA5c8d06D74cF7caB7c494E30",
"0x234DCA3528606e11544FbFb5f667722a46b809c6",
"0x57A6191c7cEBec09E9A8CD87f81a05f02f1C2f94",
"0x3AA14a201958964c1306307487777B22c4f24C50",
"0x1B71294E6bB58ACEb352BeB68cDfCF27aC81eA72",
"0xaFA5Ca5E63e51E0A0c299cCcBd134A23b62d62fe",
"0x74e21ebc0E05A96d547Dbb53BCB4D70e9aF931D7",
"0xA5Ab9d6C75d9A92de60fDd6160349958E1D84672",
"0xb4Ae787cd77782D78D04D04d5F90570cECDa9756",
"0x2056d6adA53f9daac2850ffb29b4ECAbb1AFd0d5",
"0xB43d4812f14f5284E93EE7eaa02038C07cce804f",
"0x9D534b14e38dcdE692ef3F87C4580C590D943d93",
"0xcFa5cb66AF30E3F0B4667aD8A544fad5Fd3B7248",
"0xccbd0960d994ec1c7146a631a126b00c30d47a01",
"0xb819ef10e3a00fb69e9f70ae60c86f5563cc2d0e",
"0xD0846D7D06f633b2Be43766E434eDf0acE9bA909",
"0x9cD77917DDB112d8c61b2e3D4b4Fd1209a346611",
"0x8c37c63362f2392190e00b42f3a0c68c6e5c58fa",
"0x7b2e479A47430C6f484E1fD3577C87F218E010B5",
"0x2A4Cdc9bBd937023A95E50185c0c027647f5a7b5"
];

const limitsBatch3 = [
ethers.utils.parseEther("0.12"),
ethers.utils.parseEther("0.13"),
ethers.utils.parseEther("0.14"),
ethers.utils.parseEther("0.14"),
ethers.utils.parseEther("0.14"),
ethers.utils.parseEther("0.14"),
ethers.utils.parseEther("0.15"),
ethers.utils.parseEther("0.15"),
ethers.utils.parseEther("0.15"),
ethers.utils.parseEther("0.15"),
ethers.utils.parseEther("0.15"),
ethers.utils.parseEther("0.16"),
ethers.utils.parseEther("0.16"),
ethers.utils.parseEther("0.2"),
ethers.utils.parseEther("0.2"),
ethers.utils.parseEther("0.2"),
ethers.utils.parseEther("0.21"),
ethers.utils.parseEther("0.23"),
ethers.utils.parseEther("0.24"),
ethers.utils.parseEther("0.27"),
ethers.utils.parseEther("0.28"),
ethers.utils.parseEther("0.28"),
ethers.utils.parseEther("0.28"),
ethers.utils.parseEther("0.28"),
ethers.utils.parseEther("0.31"),
ethers.utils.parseEther("0.31"),
ethers.utils.parseEther("0.32"),
ethers.utils.parseEther("0.33"),
ethers.utils.parseEther("0.34"),
ethers.utils.parseEther("0.36"),
ethers.utils.parseEther("0.38"),
ethers.utils.parseEther("0.4"),
ethers.utils.parseEther("0.4"),
ethers.utils.parseEther("0.45"),
ethers.utils.parseEther("0.47"),
ethers.utils.parseEther("0.49"),
ethers.utils.parseEther("0.5"),
ethers.utils.parseEther("0.5"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.64"),
ethers.utils.parseEther("0.75"),
ethers.utils.parseEther("0.8"),
ethers.utils.parseEther("1"),
ethers.utils.parseEther("1.11"),
ethers.utils.parseEther("1.27"),
ethers.utils.parseEther("1.61"),
ethers.utils.parseEther("1.86"),
ethers.utils.parseEther("1.9"),
ethers.utils.parseEther("1.9"),
ethers.utils.parseEther("2"),
ethers.utils.parseEther("2.2"),
ethers.utils.parseEther("2.2"),
ethers.utils.parseEther("2.4"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6")
];

// BATCH 4 ----------------------------------------------------------------------------
const addressesBatch4 = [
"0x2a303cfc47d64a05896686d1aeda1a8ae03bd178",
"0x4C374dD74eaF36E9804307C29760C73a988Cba02",
"0x5d166646411D0D0a0a4AC01C4596f8DF2d5C781a",
"0x3f529523984f91908c551B4ac9432e1049888Fd0",
"0x83b365dD3ff2B797dba9dFe6711F062907277e11",
"0x9716Dbbc717A31f2724E11d4BD1d61241bEda18c",
"0xc1146f4A68538a35f70c70434313FeF3C4456C33",
"0xb21ef9b543033e5fe50748e527c1003997deb4f0",
"0xAc3bae5A929bc7ce68F4229d4e9F227B08d82b27",
"0x52aF411F863fD97419B6e4DECb3A68ffa9246806",
"0x82843215E2733E8491a4a71b250013Ff6E1a2f57",
"0xa56a6a01282d020eF63EfF6a3f6338f26FbfAd37",
"0xc92230228B905C86b25dd504ccDb81cC348e9577",
"0x300F465A5cf74360D1c3a2b1cD366AfF558066d8",
"0x5826914A6223053038328ab3bc7CEB64db04DDc4",
"0x10c56758432434d407686E2f8a39dCD1d7066bFf",
"0x184a2EfA325793a297dDC9dBAe55e8216162C9fd",
"0x1bCf574357c15F9511448716aB450Cd3D6A5E28C",
"0xc92879d115Fa23D6D7DA27946F0DaB96Ea2DB706"
];

const limitsBatch4 = [
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.3"),
ethers.utils.parseEther("0.3"),
ethers.utils.parseEther("0.3"),
ethers.utils.parseEther("0.3"),
ethers.utils.parseEther("0.3"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.6"),
ethers.utils.parseEther("0.01")
];

module.exports = {
  addressesBatch1,
  limitsBatch1,
  addressesBatch2,
  limitsBatch2,
  addressesBatch3,
  limitsBatch3,
  addressesBatch4,
  limitsBatch4
};