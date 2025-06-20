const request = require("supertest");

const app = require("../index");

describe("Test the root path", () => {
  test("it should response the GET method", (done) => {
    request(app)
      .get("/")
      .then((response) => {
        expect(response.statusCode).toBe(200);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});
