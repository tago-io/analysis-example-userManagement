import { Device, Account } from "@tago-io/sdk";
import ServiceAuthorization from "@tago-io/sdk/out/modules/Account/ServiceAuthorization";
import { ServiceParams, TagoContext, TagoData, DeviceCreated } from "../../types";
import validation from "../../lib/validation";

export default async ({ config_dev, context, scope, account, environment }: ServiceParams) => {
  // validation variable from the device creation form
  const validate = validation("add_device_validation", config_dev);

  // Get device name from the variables
  const deviceName = scope.find((x) => x.variable === "add_device_name");
  // Get device location from the variables
  const deviceLocation = scope.find((x) => x.variable === "add_device_location");
  // Get device eui from the variables
  const deviceEUI = scope.find((x) => x.variable === "add_device_eui");

  // validate device name
  if (!deviceName.value) {
    validate("Missing device's name", "danger");
    throw "<New Device> Missing device's name";
  }

  // validate device location
  if (!deviceLocation.value) {
    validate("Missing device's location", "danger");
    throw "<New Device> Missing device's location";
  }
  // validate device EUI
  if (!deviceEUI.value) {
    validate("Missing device's deviceEUI", "danger");
    throw "<New Device> Missing device's deviceEUI";
  }

  // Check if a device name is unique
  const [device] = await config_dev.getData({ variable: "device_name", value: deviceName.value, qty: 1 });
  if (device) {
    validate("The device is aready resgistered", "danger");
    throw "<New Device> Device already exist";
  }
  // Create the device
  const newDevice = await account.devices.create({
    name: deviceName.value.toString(),
    serie_number: deviceEUI.value.toString(),
  });

  // Add tags to the device
  await account.devices.edit(newDevice.device_id, {
    tags: [
      { key: "device_type", value: "device" },
      { key: "location_id", value: deviceLocation.value },
      { key: "device_id", value: newDevice.device_id },
    ],
  });

  const serie = newDevice.device_id;

  // Send device info to # System Settings # device
  // the serie field is important to know they are from the same device
  await config_dev.sendData([
    {
      variable: "device_id",
      value: serie,
      serie,
      // this metadata is usefull to show the name in select menus in forms
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
