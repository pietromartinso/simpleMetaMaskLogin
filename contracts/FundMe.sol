//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//Importando a interface que com a função do oráculo
//Estamos importando do package NPM @chainlink/contracts (https://www.npmjs.com/package/@chainlink/contracts)
//Para corrigir o erro a seguir no VS Code: https://ethereum.stackexchange.com/questions/115006/brownie-chainlink-import-error-vscode-file-import-callback-not-supported
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

//Quero manter o registro de quem foi que mandou algo pra esse contrato
contract FundMe {
    //Atributos
    address public owner;
    mapping(address => uint256) public addressToAmountFunded;
    address[] public funders;

    //Métodos
    constructor() {
        owner = msg.sender;
    }

    function fund() public payable {
        // qual é o valor de ETH em USD, hoje, para setar um MINIMO em USD: https://data.chain.link/ethereum/mainnet/crypto-usd/eth-usd
        //Digamos que queremos um mínimo de 50 USD -> preciso "converter" para bater com o retorno do oráculo
        uint256 minimumUSD = 50 * 10**18; //(convertendo p/ WEI?) [DUVIDA]
        require(
            getConversionRate(msg.value) >= minimumUSD,
            "You need to spend more ETH!"
        ); //se essa condição não for atendida, a transação se reverte
        funders.push(msg.sender); //adicionando um novo doador (não estou verificando redundancia de doadores)
        addressToAmountFunded[msg.sender] += msg.value; //atualizando o total que alguém já doou
    }

    function getVersion() public view returns (uint256) {
        // ao instanciar um novo price feed, preciso do endereço do contrato na respectiva rede (rinkeby)
        // para descobrir: https://docs.chain.link/docs/ethereum-addresses/
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        );
        return priceFeed.version();
    }

    function getPrice() public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        );
        (
            ,
            /*uint80 roundId*/
            //Para o compilador parar de reclamar sobre o retorno do latestRoundData (tupla)
            int256 answer, /*uint256 startedAt*/
            ,
            ,

        ) = /*uint256 updatedAt*/
            /*uint80 answeredInRound*/
            priceFeed.latestRoundData();
        return uint256(answer * 10000000000); //Multiplico por 10^10 para que tenhamos 10^18 decimais (a resposta já tem 8 decimais)
    }

    //1 Gwei = 1000000000 wei
    function getConversionRate(uint256 ethAmount)
        public
        view
        returns (uint256)
    {
        uint256 ethPrice = getPrice();
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1000000000000000000; //A resposta estará em WEI, e eu quero em ETH
        return ethAmountInUsd;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the publisher of the contract have this permission!"
        );
        _;
    }

    function withdraw() public payable onlyOwner {
        //Estou enviando para o "sender" todo o balance do contrato atual (THIS)
        //Se eu quisesse que o "sender" enviasse algo, invocaria o send()? [DUVIDA]
        payable(msg.sender).transfer(address(this).balance);
        //Ao sacar, preciso "zerar" os valores associados a cada doador
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }
        funders = new address[](0); //"resetando" o array de funders
    }
}
