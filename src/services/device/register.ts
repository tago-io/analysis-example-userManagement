import { Device, Account } from "@tago-io/sdk";
import ServiceAuthorization from "@tago-io/sdk/out/modules/Account/ServiceAuthorization";
import { ServiceParams, TagoContext, TagoData, DeviceCreated } from "../../types";
import validation from "../../lib/validation";

export default async ({ config_dev, context, scope, account, environment }: ServiceParams) => {
  const validate = validation("add_device_validation", config_dev);

  const deviceName = scope.find((x) => x.variable === "add_device_name");
  const deviceLocation = scope.find((x) => x.variable === "add_device_location");
  const deviceEUI = scope.find((x) => x.variable === "add_device_eui");

  if (!deviceName.value) {
    validate("Missing device's name", "danger");
    throw "<New Device> Missing device's name";
  }

  if (!deviceLocation.value) {
    validate("Missing device's location", "danger");
    throw "<New Device> Missing device's location";
  }

  if (!deviceEUI.value) {
    validate("Missing device's deviceEUI", "danger");
    throw "<New Device> Missing device's deviceEUI";
  }

  const [device] = await config_dev.getData({ variable: "device_name", value: deviceName.value, qty: 1 });
  if (device) {
    validate("The device is aready resgistered", "danger");
    throw "<New Device> Device already exist";
  }
  const newDevice = await account.devices.create({
    name: deviceName.value.toString(),
    serie_number: deviceEUI.value.toString(),
  });

  await account.devices.edit(newDevice.device_id, {
    tags: [
      { key: "device_type", value: "device" },
      { key: "location_id", value: deviceLocation.value },
      { key: "device_id", value: newDevice.device_id },
    ],
  });

  const serie = newDevice.device_id;
  await config_dev.sendData([
    {
      variable: "device_id",
      value: serie,
      serie,
      metadata: { label: deviceName.value },
    },
    {
      variable: "device_name",
      value: deviceName.value,
      serie,
    },
    {
      variable: "device_eui",
      value: deviceEUI.value,
      serie,
    },
    {
      variable: "device_location_name",
      // @ts-ignore
      value: deviceLocation.metadata.label,
      serie,
    },
    {
      variable: "device_location_id",
      value: deviceLocation.value,
      serie,
    },
  ]);

  validate("Device successfully added", "success");
};
