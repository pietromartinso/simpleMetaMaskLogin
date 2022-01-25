//1 - PQ NÃO MOSTRA TODAS AS CONTAS? É normal isso?

//2 - Logout: remover conexão via metamask é possível? (acc -> ... -> connected sites -> trash)

// Problema com gas fees em algumas transações

//5 - Com login habilitado, dar opção de realizar todas as opções do contrato
//de acordo com as permissões da conta no contrato: "Onwer" ou "User"
// Independente de Owner ou User
// -> Eth price

// Owner 
//   -> Eth price
//   -> Balance
//   withdraw()

//   *Futuro: setMinimumUsd, getAddressToAmountFunded, listAddressessToAmountsFunded

// User
//   -> Eth price
//   fund()

//   *Futuro: setMinimumUsd, getAmountFunded

window.userAddress = null //criando variável userAddress e setando para null
window.contract = null
window.contractAddress = "0x2321d1f815421f0bcb65017db18e06744abf3abc"
Boolean 

//Ao iniciar a janela: inicializa Web3(browser) conectada ao ETH(MetaMask+Ganache)
window.onload = async () => {
  if(window.ethereum){ //Metamask está instalado?
    
    if(window.web3){ //foi possível instanciar o web3?
      window.web3 = new Web3(ethereum); //instanciando a variável web3 da janela
    } else {
      alert('MetaMask found but no Web3 found.');
    }
    document.getElementById("connectionStatus").innerText = "MetaMask status: installed"
  } else {
    document.getElementById("connectionStatus").innerText = "MetaMask status: absent"
  }
  // Load from localstore to window key from "previous login"
  window.userAddress = window.localStorage.getItem("userAddress")
  refreshFE()

  window.contract = await new window.web3.eth.Contract(window.ABI, window.contractAddress) //instanciando o contrato localmente
  
}

// Função interna para imprimir na tela o endereço de login (caso já tenha clicado em login antes)
function refreshFE(){
  if(!window.userAddress){ //se a variável userAddress da janela não estiver ok, não mostrar userAddress na tela
    document.getElementById("userAddress").innerText = ""
    document.getElementById("logOutButton").classList.add("hidden") //removendo o botão de logout
    document.getElementById("logInButton").classList.remove("hidden") 
    document.getElementById("etherPriceButton").classList.add("hidden")
    document.getElementById("getBalanceButton").classList.add("hidden")
    document.getElementById("inputValue").classList.add("hidden")
    document.getElementById("inputValueLabel").classList.add("hidden")
    document.getElementById("fundButton").classList.add("hidden")
    document.getElementById("withdrawFundsButton").classList.add("hidden")
    
    return false
  } 
  document.getElementById("userAddress").innerText = `ETH Address: ${window.userAddress}` //atualizando o conteúdo do HTML com o address 
  document.getElementById("logOutButton").classList.remove("hidden") //mostrando o botão de logout
  document.getElementById("logInButton").classList.add("hidden") 
  document.getElementById("etherPriceButton").classList.remove("hidden")
  document.getElementById("getBalanceButton").classList.remove("hidden")
  document.getElementById("inputValue").classList.remove("hidden")
  document.getElementById("inputValueLabel").classList.remove("hidden")
  document.getElementById("fundButton").classList.remove("hidden")
  document.getElementById("withdrawFundsButton").classList.remove("hidden")
}

function logout(){ //esse logout aqui não tem efeitos no metamask, ou seja, continua conectado por lá!
  window.userAddress = null //apenas apaga o conteúdo da variável da janela
  window.localStorage.removeItem("userAddress") //apenas apaga o conteúdo do local storage
  refreshFE() //atualiza o conteúdo do item HTML lá na frente
}

async function loginWithEth(){
  
  if(window.ethereum){

    try {

      //documentação do metamask pede RPC CALLS:
      /*const accounts = await ethereum
        .request({ method: 'eth_requestAccounts' })
        .then()
        .catch((error) => {
          if (error.code === 4001) {
            console.log('Please connect to MetaMask.');
          } else {
            console.error(error);
          }
      });*/

      await window.ethereum.enable()
      const accounts = await window.web3.eth.getAccounts()
      if(accounts.length != 0){
        window.userAddress = accounts[0]
        window.localStorage.setItem("userAddress", accounts[0]) //salvando end[0] na variável userAddress (armazenamento local do browser)
      } else {
        window.userAddress = "Empty!"
      }
      refreshFE()

    } catch (err) {
      console.log(err)
    }
  }
}

async function getEtherPrice() {
  try{
    const response = await window.contract.methods.getPrice().call({from: window.userAddress}) //invocando getPrice() do Smart Contract
    let priceText = formatWeiToFloat(response, 2)
    document.getElementById("ethPrice").innerText = `ETH price is now US$ ${priceText}`
  } catch (err) {
    console.log(err)
  }
}

async function getContractBalance() {
  try{
    const response = await window.web3.eth.getBalance(window.contractAddress);
    balanceText = formatWeiToFloat(response, 5)
    document.getElementById("ethBalance").innerText = `Balance is now: ${balanceText} ETH`
  } catch (err){
    console.log(err)
  }
}

//https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#methods-mymethod-send
async function fundContract(){
  try{
    let _val = document.getElementById("inputValue").value
    if(_val){
      _val = formatFloatToWei(_val)
      debugger
      await window.contract.methods.fund().send({from: window.userAddress, value: _val}) 
    } else {
      alert("You are trying to fund empty value. Please, set the ETH amount to deposit.")
      return
    }
    
  } catch (err){
    console.log(err)
  }
}

//Why is there cases in witch I receive the "insuficiente gas"
//Even if I specify gas and gasprice...
async function withdrawFunds(){
  try{
    await window.contract.methods.withdraw().send({from: window.userAddress})     
  } catch (err){
    console.log(err)
  }
}

function formatWeiToFloat(val, precision) {
  let res = (parseInt(val) / (10 ** 18)).toString()
  let i = res.indexOf(".")
  res = res.substring(0, i+precision+1)
  return res
}

function formatFloatToWei(val) {
  return (parseFloat(val) * (10 ** 18))
}

//ABI do contrato (Posso conseguir isso via TRUFFLE/REMIX, criando o SC e compilando)
//fazer uma forma de a migration criar esse objeto e colocar ele no devido lugar;
//fazer esse conteúdo aqui importar o conteúdo de um arquivo
window.ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "addressToAmountFunded",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fund",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "funders",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "ethAmount",
        "type": "uint256"
      }
    ],
    "name": "getConversionRate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVersion",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];