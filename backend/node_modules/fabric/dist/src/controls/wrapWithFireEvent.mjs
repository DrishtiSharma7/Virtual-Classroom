import { commonEventInfo } from "./util.mjs";
import { fireEvent } from "./fireEvent.mjs";
//#region src/controls/wrapWithFireEvent.ts
/**
* Wrap an action handler with firing an event if the action is performed
* @param {TModificationEvents} eventName the event we want to fire
* @param {TransformActionHandler<T>} actionHandler the function to wrap
* @param {object} extraEventInfo extra information to pas to the event handler
* @return {TransformActionHandler<T>} a function with an action handler signature
*/
const wrapWithFireEvent = (eventName, actionHandler, extraEventInfo) => {
	return ((eventData, transform, x, y) => {
		const actionPerformed = actionHandler(eventData, transform, x, y);
		if (actionPerformed) fireEvent(eventName, {
			...commonEventInfo(eventData, transform, x, y),
			...extraEventInfo
		});
		return actionPerformed;
	});
};
//#endregion
export { wrapWithFireEvent };

//# sourceMappingURL=wrapWithFireEvent.mjs.map