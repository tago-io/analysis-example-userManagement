import { Device, Account } from "@tago-io/sdk";
import { ServiceParams, TagoContext, TagoData, DeviceCreated } from "../../types";
import validation from "../../lib/validation";
import inviteUser from "../../lib/registerUser";

export default async ({ config_dev, context, scope, account, environment }: ServiceParams) => {
  const doaminUrl = "https://localhost";
  const { timezone } = await account.info();

  // validation variable from the user creation form
  const validate = validation("add_user_validation", config_dev);

  // Get user name from the variables
  const userName = scope.find((x) => x.variable === "add_user_name");
  // Get user email from the variables
  const userEmail = scope.find((x) => x.variable === "add_user_email");
  // Get user address from the variables
  const userAddress = scope.find((x) => x.variable === "add_user_address");
  // Get user company id from the variables
  const userCompany = scope.find((x) => x.variable === "add_user_company");

  // validate user name
  if (!userName.value) {
    validate("Missing user's name", "danger");
    throw "<New Device> Missing user's name";
  }

  // validate user email
  if (!userEmail.value) {
    validate("Missing user's email", "danger");
    throw "<New Device> Missing user's email";
  }

  // validate user address
  if (!userAddress.value) {
    validate("Missing user's address", "danger");
    throw "<New Device> Missing user's address";
  }

  // validate user company
  if (!userCompany.value) {
    validate("Missing user's company", "danger");
    throw "<New Device> Missing user's company";
  }

  // Check if a user email is unique
  const [user] = await config_dev.getData({ variable: "user_email", value: userEmail.value, qty: 1 });
  if (user) {
    validate("The user is aready resgistered", "danger");
    throw "<New Device> User already exist";
  }

  // user data
  const userData = {
    name: userName.value.toString(),
    email: userEmail.value.toString(),
    address: userAddress.value.toString(),
    company: userCompany.value.toString(),
    timezone,
    tags: [
      // this will set the role
      { key: "access_level", value: "user" },
      // this is the company that the user pertences
      { key: "company_id", value: userCompany.value.toString() },
    ],
  };

  // Create a new user
  const newUser = await inviteUser(context, account, userData, doaminUrl);

  // Send user info to # System Settings # device
  // the serie field is important to know they are from the same user
  await config_dev.sendData([
    {
      variable: "user_name",
      value: userName.value,
      serie: newUser,
    },
    {
      variable: "user_email",
      value: userEmail.value,
      serie: newUser,
    },
    {
      variable: "user_company",
      value: userCompany.value,
      serie: newUser,
      // @ts-ignore
      metadata: { label: userCompany.metadata.label },
    },
    {
      variable: "user_company_name",
      //@ts-ignore
      value: userCompany.metadata.label,
      serie: newUser,
    },
    {
      variable: "user_address",
      value: userAddress.value,
      serie: newUser,
    },
  ]);

  validate("User successfully added", "success");
};
