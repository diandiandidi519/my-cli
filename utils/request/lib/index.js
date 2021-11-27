"use strict";
const axios = require("axios");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:7001";

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

request.interceptors.response.use(
  (response) =>{
    return response.data;
  },
  (err) => {
    return Promise.reject(err);
  }
)

const getProjectTemplate = async () => {
  return request.get("/project/list");
};

module.exports = {
  getProjectTemplate,
};
