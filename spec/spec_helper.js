import chai from "chai";
import sinonChai from "sinon-chai";
import tmp from "tmp";

import "./factories/conf_entry";

process.env.NODE_ENV = process.env.NODE_ENV || "test";

// set graceful cleanup of temp files
tmp.setGracefulCleanup();

chai.use(sinonChai);