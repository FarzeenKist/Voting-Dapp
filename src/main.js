import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import votingAbi from "../contract/voting.abi.json";
import erc20Abi from "../contract/erc20.abi.json";

const ERC20_DECIMALS = 18;
const votingAddress = "0x9c3b5D772eF1D722fd5100E700019Baa85cb0dab";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

let kit;
let contract;
let products = [];

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.");
    try {
      await window.celo.enable();
      notificationOff();

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(votingAbi, votingAddress);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

// async function approve(_price) {
//   const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

//   const result = await cUSDContract.methods
//     .approve(votingAddress, _price)
//     .send({ from: kit.defaultAccount })
//   return result
// }

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  document.querySelector("#balance").textContent = cUSDBalance;
};

const Idlength = async function () {
  const _productsLength = await contract.methods.ID().call();
  const _products = [];
  for (let i = 1; i < _productsLength; i++) {
    let _product = new Promise(async (resolve, reject) => {
      let result = await contract.methods.getVoteDetails(i).call();
      console.log("trfdhghgj", result);
      resolve({
        index: i,
        owner: result[0],
        name: result[1],
        noOfVote: result[2],
        duration: result[3],
        image: result[4],
        // price: new BigNumber(result[5]),
        // sold: result[6],
      });
    });
    _products.push(_product);
  }
  products = await Promise.all(_products);
  console.log("products", products);
  renderProducts();
};

function renderProducts() {
  document.getElementById("marketplace").innerHTML = "";
  products.forEach((_product) => {
    const newDiv = document.createElement("div");
    newDiv.className = "col-md-4";
    newDiv.innerHTML = productTemplate(_product);
    document.getElementById("marketplace").appendChild(newDiv);
  });
}

function productTemplate(_product) {
  console.log("res", _product.owner);
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_product.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        ${_product.noOfVote} Vote
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_product.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_product.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_product.name}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>Vote Ends in ${_product.duration}</span>
        </p>
        <div class="flex gap-2">
        <a class="btn btn-lg btn-outline-dark badBtn fs-6 p-3" id=${_product.index} value=${0}>Bad</a>
        <a class="btn btn-lg btn-outline-dark averageBtn fs-6 p-3" id=${_product.index} value=${1}>Average</a>
        <a class="btn btn-lg btn-outline-dark goodBtn fs-6 p-3" id=${_product.index} value=${2}>Good</a>
      </div>

        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark voteResultBtn fs-6 p-3" id=${
            _product.index
          }>
            Get Vote Result
          </a>
        </div>
      </div>
    </div>
  `;
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `;
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  // await getProducts()
  await Idlength();
  notificationOff();
});

document
  .querySelector("#newProductBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newProductName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newProductDescription").value,
      document.getElementById("newLocation").value,
      new BigNumber(document.getElementById("newPrice").value)
        .shiftedBy(ERC20_DECIMALS)
        .toString(),
    ];
    notification(`⌛ Adding "${params[0]}"...`);
    try {
      const result = await contract.methods
        .writeProduct(...params)
        .send({ from: kit.defaultAccount });
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
    notification(`🎉 You successfully added "${params[0]}".`);
    getProducts();
  });

document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("voteResultBtn")) {
    const index = e.target.id;
    notification("⌛ Fetching Vote Result...");
    try {
      const result = await contract.methods
      .totalVote(index)
      .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ already Voted...`);
      return;
    }
    notification(`🎉 You've Voted successfully.`)
    await Idlength()
  }
});

/***********************Bad BTN**************** */
document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("badBtn")) {
    const index = e.target.id;
    const value = e.target.value;
    notification(`⌛ ${kit.defaultAccount} voting for Bad...`)
    try {
      const result = await contract.methods
      .Vote(index, 0)
      .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ already Voted...`);
      return;
    }
    notification(`🎉 You've Voted successfully.`)
    await Idlength()
  }
});

/*************************Average BTN****************** */
document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("averageBtn")) {
    const index = e.target.id;
    const value = e.target.value;
    notification(`⌛ ${kit.defaultAccount} voting for Average...`)
    try {
      const result = await contract.methods
      .Vote(index, 1)
      .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ already Voted...`);
      return;
    }
    notification(`🎉 You've Voted successfully.`)
    await Idlength()
  }
});


/********************Good btn*********************** */
document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("goodBtn")) {
    const index = e.target.id;
    const value = e.target.value;
    console.log(value)
    notification(`⌛ ${kit.defaultAccount} voting for Good...`)
    try {
      const result = await contract.methods
      .Vote(index, 2)
      .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ already Voted...`);
      return;
    }
    notification(`🎉 You've Voted successfully.`)
    await Idlength()
  }
});
