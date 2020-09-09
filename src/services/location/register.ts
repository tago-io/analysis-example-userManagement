import { Device, Account } from "@tago-io/sdk";
import ServiceAuthorization from "@tago-io/sdk/out/modules/Account/ServiceAuthorization";
import { ServiceParams, TagoContext, TagoData, DeviceCreated } from "../../types";
import validation from "../../lib/validation";

export default async ({ config_dev, context, scope, account, environment }: ServiceParams) => {
  const validate = validation("add_location_validation", config_dev);

  const locationName = scope.find((x) => x.variable === "add_location_name");
  const locationCompany = scope.find((x) => x.variable === "add_location_company");

  if (!locationName.value) {
    validate("Missing location's name", "danger");
    throw "<New Device> Missing location's name";
  }

  if (!locationCompany.value) {
    validate("Missing location's company", "danger");
    throw "<New Device> Missing location's company";
  }

  const [location] = await config_dev.getData({ variable: "location_name", value: locationName.value, qty: 1 });
  if (location) {
    validate("The location is aready resgistered", "danger");
    throw "<New Device> Location already exist";
  }

  const newLocation = await account.devices.create({
    name: locationName.value.toString(),
  });

  await account.devices.edit(newLocation.device_id, {
    tags: [
      { key: "device_type", value: "location" },
      { key: "company_id", value: locationCompany.value },
      { key: "location_id", value: newLocation.device_id },
    ],
  });

  const serie = newLocation.device_id;
  await config_dev.sendData([
    {
      variable: "location_id",
      value: serie,
      serie,
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
