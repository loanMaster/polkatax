import { InjectionMode, createContainer } from "awilix";
import { registerServices as registerBlockchainServices } from "./blockchain/registerServices";
import { registerServices as registerEndpointServices } from "./endpoints/registerServices";

export const DIContainer = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

registerBlockchainServices(DIContainer);
registerEndpointServices(DIContainer);
