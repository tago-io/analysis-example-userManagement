import { Device, Account } from "@tago-io/sdk";
import ServiceAuthorization from "@tago-io/sdk/out/modules/Account/ServiceAuthorization";
import { ServiceParams, TagoContext, TagoData, DeviceCreated } from "../../types";
import validation from "../../lib/validation";

export default async ({ config_dev, context, scope, account, environment }: ServiceParams) => {
  // validation variable from the company creation form
  const validate = validation("add_company_validation", config_dev);

  // Get company name from the "add_company_name" variable
  const companyName = scope.find((x) => x.variable === "add_company_name");

  // If the field was no sent, will return an error in the form validation field
  if (!companyName.value) {
    validate("Missing company's name", "danger");
    throw "<New Device> Missing company's name";
  }

  // Checks if a company with the same name has not been registered
  const [company] = await config_dev.getData({ variable: "company_name", value: companyName.value, qty: 1 });
  if (company) {
    validate("The company is aready resgistered", "danger");
    throw "<New Device> Company already exist";
  }

  // Create the company device
  const newCompany = await account.devices.create({ name: companyName.value.toString() });

  // Add tags to the device
  await account.devices.edit(newCompany.device_id, {
    tags: [
      { key: "company_id", value: newCompany.device_id },
      { key: "device_type", value: "company" },
    ],
  });

  const serie = newCompany.device_id;

  // Send company info to # System Settings # device
  // the serie field is important to know they are from the same company
  await config_dev.sendData([
    {
      variable: "company_id",
      value: serie,
      serie,
      metadata: {
        // this metadata is usefull to show the name in select menus in forms
        label: companyName.value,
      },
    },
    {
      variable: "company_name",
      value: companyName.value,
      serie,
    },
  ]);

  validate("company successfuly added", "success");
};
