const { PrismaClient } = require("@prisma/client");

const dotenv = require("dotenv");
const express = require("express");
const app = express();
//Catching Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception ! Shutting down");
  console.log(err.name, err.message);

  process.exit(1);
});

dotenv.config({ path: "./.env" });
const DB = process.env.DATABASE;

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (!allowedFields.includes(el)) {
      newObj[el] = parseInt(obj[el]);
    }
  });
  return newObj;
};

app.get("/Api", async (req, res) => {
  let { ticker, column, period } = req.query;

  let selectedVals = {};
  column ? column.split(",").map((item) => (selectedVals[item] = true)) : [];

  let curYear = new Date().getFullYear();
  period = period ? parseInt(period.split("y").slice(0, -1)[0]) : curYear;
  let periodSelection = [];
  for (let index = curYear - period; index <= curYear; index++) {
    periodSelection.push({
      date: {
        contains: `%${index}`,
      },
    });
  }

  const result = await prisma.sampledata.findMany({
    where: {
      ticker: ticker,
      OR: periodSelection,
    },
    select: column
      ? selectedVals
      : {
          id: true,
          ticker: true,
          date: true,
          revenue: true,
          gp: true,
          fcf: true,
          capex: true,
        },
  });

  const serializedResult = result.map((item) =>
    column
      ? filterObj(item, selectedVals)
      : {
          ...item,
          revenue: parseInt(item.revenue),
          gp: parseInt(item.gp),
          fcf: parseInt(item.fcf),
          capex: parseInt(item.capex),
        }
  );

  res.json(serializedResult);
});

//console

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on Port ${port}...`);
});
//Unhandled Rejection
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled rejection! Shutting down");
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM recieved .Shutting down gracefully");
  server.close(() => {
    console.log("Process terminated !");
  });
});

const prisma = new PrismaClient();

async function insertUser() {}
