import { Analysis } from "@tago-io/sdk";
import { startAnalysis } from "./handler";

export default new Analysis(startAnalysis, { token: "" }); // <--- your analysis token here
