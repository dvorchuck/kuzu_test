import kuzu from "kuzu";
import * as fs from "fs";

console.log("os", process.platform, "arch", process.arch);

async function setup() {
  // Create database directory if it doesn't exist
  // const dbPath = "./my-kuzu-db";
  const dbPath = ":memory:";

  // Initialize DB and connection
  console.log("Setting up database at", dbPath);
  const db = new kuzu.Database(dbPath);
  console.log("Database initialized");

  const conn = new kuzu.Connection(db);

  console.log("Connection established");
  // Schema creation
  await conn.query(`
    CREATE NODE TABLE IF NOT EXISTS Person(name STRING, age INT64, PRIMARY KEY(name));
  `);
  console.log("Person table created");
  await conn.query(`
    CREATE REL TABLE IF NOT EXISTS Knows(FROM Person TO Person, since INT64);
  `);
  console.log("Knows relationship table created");

  return conn;
}

function createCsv(n) {
  return (
    "name,age\n" +
    Array.from(Array(n).keys())
      .map((el) => {
        return `Alice${el},30`;
      })
      .join("\n")
  );
}

function createRelationCsv(n) {
  return (
    /** for relationship table csv, the first row is ommited */
    // "FROM,TO,since\n" +
    Array.from(Array(n - 1).keys())
      .map((el) => {
        return `Alice${el},Alice${el + 1},10`;
      })
      .join("\n")
  );
}

async function main() {
  const N = 100_000;

  const start = performance.now();

  const connection = await setup();


  if (!fs.existsSync("./csv")) {
    fs.mkdirSync("./csv");
  }

  // person setup
  const csvPath = "./csv/person.csv";
  fs.writeFileSync(csvPath, createCsv(N));

  const startQuery = performance.now();
  await connection.query(`COPY PERSON FROM "${csvPath}"`);

  console.log(`Person setup took ${performance.now() - startQuery}ms`);

  // knows setup
  const startQueryKnows = performance.now();
  const relationPath = "./csv/knows.csv";
  fs.writeFileSync(relationPath, createRelationCsv(N));
  await connection.query(`COPY KNOWS FROM "${relationPath}"`);

  console.log(`Knows setup took ${performance.now() - startQueryKnows}ms`);

  // setup summary
  console.log(`Whole setup took ${performance.now() - start}ms`);

  // // Query and print results
  // const result = await connection.query(`
  //   MATCH (a:Person)
  //   RETURN a.name;
  // `);

  // while (await result.hasNext()) {
  //   const row = await result.getNext();
  //   // console.log(row);
  // }

  // // Query and print results
  // const resultRelation = await connection.query(`
  //   MATCH (a:Person)-[e:Knows]->(b:Person)
  //   RETURN a.name, e.since, b.name;
  // `);

  // while (await resultRelation.hasNext()) {
  //   const row = await resultRelation.getNext();
  //   console.log(row);
  // }
}

try {
  await main();
} catch (e) {
  console.error("Error in main:", e);
}

setInterval(() => { }, 1000); // keep the process alive to inspect memory usage