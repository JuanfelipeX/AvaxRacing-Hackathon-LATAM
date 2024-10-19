const express = require("express");
const { Web3 } = require("web3");
const bodyParser = require("body-parser");

//Parte del Conexion LFS
const { InSim } = require("node-insim");
const { IR_HLR, PacketType } = require("node-insim/packets");

const inSim = new InSim();
inSim.connectRelay();

inSim.on("connect", () => {
  console.log("Connected");
  inSim.send(new IR_HLR());
});

inSim.on("disconnect", () => console.log("Disconnected"));

inSim.on(PacketType.IS_RES, (packet) => {
  packet.Info.forEach((host) => {
    console.log(`- ${host.HName}`);
  });
});

process.on("uncaughtException", (error) => {
  console.log(error);
});



//Parte Web3
// Configura el servidor
const app = express();
app.use(bodyParser.json());

// Configuración de Web3 con el RPC de la testnet de Fuji de Avalanche
const web3 = new Web3(
  "https://laughing-barnacle-xx775pgwx5p2pq5q-9650.app.github.dev/ext/bc/avaxRacingToken/rpc",
); // URL del RPC de AvaxRacing

// Endpoint para conectar la wallet de MetaMask
app.post("/api/sendTransaction", async (req, res) => {
  try {
    const { fromAddress, toAddress, amount, privateKey } = req.body;

    // Verifica que todos los datos necesarios estén presentes
    if (!fromAddress || !toAddress || !amount || !privateKey) {
      return res.status(400).json({
        error: "Missing required parameters",
      });
    }

    // Crear una transacción
    const tx = {
      from: fromAddress,
      to: toAddress,
      value: web3.utils.toWei(amount, "ether"), // Convertir la cantidad a Wei
      gas: 22000,
      gasPrice: web3.utils.toWei("0.00001", "ether"), // Gas price en Wei
    };

    // Firmar la transacción
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    // Enviar la transacción
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction,
    );

    res.status(200).json({
      message: "Transaction successful",
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    // Proporcionar más detalles sobre el error
    console.error("Transaction error:", error);
    res.status(500).json({
      error: "Transaction failed",
      details: error.message,
    });
  }
});

// Inicia el servidor en el puerto 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
