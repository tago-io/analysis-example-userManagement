import { Device, Account } from "@tago-io/sdk";
import ServiceAuthorization from "@tago-io/sdk/out/modules/Account/ServiceAuthorization";
import { ServiceParams, TagoContext, TagoData, DeviceCreated } from "../../types";
import validation from "../../lib/validation";

export default async ({ config_dev, context, scope, account, environment }: ServiceParams) => {
  // validation variable from the location creation form
  const validate = validation("add_location_validation", config_dev);
  // Get location name from the variables
  const locationName = scope.find((x) => x.variable === "add_location_name");
  // Get location company id from the variables
  const locationCompany = scope.find((x) => x.variable === "add_location_company");

  // validate location name
  if (!locationName.value) {
    validate("Missing location's name", "danger");
    throw "<New Device> Missing location's name";
  }

  // validate location company
  if (!locationCompany.value) {
    validate("Missing location's company", "danger");
    throw "<New Device> Missing location's company";
  }

  // Check if a location name is unique
  const [location] = await config_dev.getData({ variable: "location_name", value: locationName.value, qty: 1 });
  if (location) {
    validate("The location is aready resgistered", "danger");
    throw "<New Device> Location already exist";
  }

  // Create the location device
  const newLocation = await account.devices.create({
    name: locationName.value.toString(),
  });

  // Add tags to the device
  await account.devices.edit(newLocation.device_id, {
    tags: [
      { key: "device_type", value: "location" },
      { key: "company_id", value: locationCompany.value },
      { key: "location_id", value: newLocation.device_id },
    ],
  });

  const serie = newLocation.device_id;
  // Send location info to # System Settings # device
  // the serie field is important to know they are from the same location
  await config_dev.sendData([
    {
      variable: "location_id",
      value: serie,
      serie,
      // this metadata is usefull to show the name in select menus in forms
      metadata: { label: locationName.value },
    },
    {
      variable: "location_name",
      value: locationName.value,
      serie,
    },
    {
      variable: "location_company",
      // @ts-ignore
      value: locationCompany.metadata.label,
      serie,
    },
  ]);

  validate("Location successfully added", "success");
};
