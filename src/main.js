import kuzu from "kuzu";
import * as fs from "fs";

async function setup() {
  // Create database directory if it doesn't exist
  // const dbPath = "./my-kuzu-db";
  const dbPath = ":memory:";

  // Initialize DB and connection
  const db = new kuzu.Database(dbPath);
  const conn = new kuzu.Connection(db);

  // Schema creation
  await conn.query(`
    CREATE NODE TABLE IF NOT EXISTS Person(name STRING, age INT64, PRIMARY KEY(name));
  `);
  await conn.query(`
    CREATE REL TABLE IF NOT EXISTS Knows(FROM Person TO Person, since INT64);
  `);

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
    "from,to,years\n" +
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

  console.log(`Knows setup took ${performance.now() - startQueryKnows}ms`);

  // setup summary
  console.log(`Whole setup took ${performance.now() - start}ms`);

  // Query and print results
  // const result = await connection.query(`
  //   MATCH (a:Person)
  //   RETURN a.name;
  // `);

  // while (await result.hasNext()) {
  //   const row = await result.getNext();
  //   // console.log(row);
  // }

  connection.close();
}

main();
