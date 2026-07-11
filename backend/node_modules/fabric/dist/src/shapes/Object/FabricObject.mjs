import { classRegistry } from "../../ClassRegistry.mjs";
import { FabricObjectSVGExportMixin } from "./FabricObjectSVGExportMixin.mjs";
import "./defaultValues.mjs";
import { InteractiveFabricObject } from "./InteractiveObject.mjs";
import { applyMixins } from "../../util/applyMixins.mjs";
//#region src/shapes/Object/FabricObject.ts
var FabricObject = class extends InteractiveFabricObject {};
applyMixins(FabricObject, [FabricObjectSVGExportMixin]);
classRegistry.setClass(FabricObject);
classRegistry.setClass(FabricObject, "object");
//#endregion
export { FabricObject };

//# sourceMappingURL=FabricObject.mjs.map