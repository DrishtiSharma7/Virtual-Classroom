import { _defineProperty } from "../../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { Point } from "../../Point.mjs";
import { invertTransform } from "../../util/misc/matrix.mjs";
import { DraggableTextDelegate } from "./DraggableTextDelegate.mjs";
import { ITextKeyBehavior } from "./ITextKeyBehavior.mjs";
//#region src/shapes/IText/ITextClickBehavior.ts
/**
* `LEFT_CLICK === 0`
*/
const notALeftClick = (e) => !!e.button;
var ITextClickBehavior = class extends ITextKeyBehavior {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "draggableTextDelegate", void 0);
	}
	initBehavior() {
		this.on("mousedown", this._mouseDownHandler);
		this.on("mouseup", this.mouseUpHandler);
		this.on("mousedblclick", this.doubleClickHandler);
		this.on("mousetripleclick", this.tripleClickHandler);
		this.draggableTextDelegate = new DraggableTextDelegate(this);
		super.initBehavior();
	}
	/**
	* If this method returns true a mouse move operation over a text selection
	* will not prevent the native mouse event allowing the browser to start a drag operation.
	* shouldStartDragging can be read 'do not prevent default for mouse move event'
	* To prevent drag and drop between objects both shouldStartDragging and onDragStart should return false
	* @returns
	*/
	shouldStartDragging() {
		return this.draggableTextDelegate.isActive();
	}
	/**
	* @public override this method to control whether instance should/shouldn't become a drag source,
	* @see also {@link DraggableTextDelegate#isActive}
	* To prevent drag and drop between objects both shouldStartDragging and onDragStart should return false
	* @returns {boolean} should handle event
	*/
	onDragStart(e) {
		return this.draggableTextDelegate.onDragStart(e);
	}
	/**
	* @public override this method to control whether instance should/shouldn't become a drop target
	*/
	canDrop(e) {
		return this.draggableTextDelegate.canDrop(e);
	}
	/**
	* Default handler for double click, select a word
	*/
	doubleClickHandler(options) {
		if (!this.isEditing) return;
		this.selectWord(this.getSelectionStartFromPointer(options.e));
		this.renderCursorOrSelection();
	}
	/**
	* Default handler for triple click, select a line
	*/
	tripleClickHandler(options) {
		if (!this.isEditing) return;
		this.selectLine(this.getSelectionStartFromPointer(options.e));
		this.renderCursorOrSelection();
	}
	/**
	* Default event handler for the basic functionalities needed on _mouseDown
	* can be overridden to do something different.
	* Scope of this implementation is: find the click position, set selectionStart
	* find selectionEnd, initialize the drawing of either cursor or selection area
	* initializing a mousedDown on a text area will cancel fabricjs knowledge of
	* current compositionMode. It will be set to false.
	*/
	_mouseDownHandler({ e, alreadySelected }) {
		if (!this.canvas || !this.editable || notALeftClick(e) || this.getActiveControl()) return;
		if (this.draggableTextDelegate.start(e)) return;
		this.canvas.textEditingManager.register(this);
		if (alreadySelected) {
			this.inCompositionMode = false;
			this.setCursorByClick(e);
		}
		if (this.isEditing) {
			this.__selectionStartOnMouseDown = this.selectionStart;
			if (this.selectionStart === this.selectionEnd) this.abortCursorAnimation();
			this.renderCursorOrSelection();
		}
		this.selected || (this.selected = alreadySelected || this.isEditing);
	}
	/**
	* standard handler for mouse up, overridable
	* @private
	*/
	mouseUpHandler({ e, transform }) {
		const didDrag = this.draggableTextDelegate.end(e);
		if (this.canvas) {
			this.canvas.textEditingManager.unregister(this);
			const activeObject = this.canvas._activeObject;
			if (activeObject && activeObject !== this) return;
		}
		if (!this.editable || this.group && !this.group.interactive || transform && transform.actionPerformed || notALeftClick(e) || didDrag) return;
		if (this.selected && !this.getActiveControl()) {
			this.enterEditing(e);
			if (this.selectionStart === this.selectionEnd) this.initDelayedCursor(true);
			else this.renderCursorOrSelection();
		}
	}
	/**
	* Changes cursor location in a text depending on passed pointer (x/y) object
	* @param {TPointerEvent} e Event object
	*/
	setCursorByClick(e) {
		const newSelection = this.getSelectionStartFromPointer(e), start = this.selectionStart, end = this.selectionEnd;
		if (e.shiftKey) this.setSelectionStartEndWithShift(start, end, newSelection);
		else {
			this.selectionStart = newSelection;
			this.selectionEnd = newSelection;
		}
		if (this.isEditing) {
			this._fireSelectionChanged();
			this._updateTextarea();
		}
	}
	/**
	* Returns index of a character corresponding to where an object was clicked
	* @param {TPointerEvent} e Event object
	* @return {Number} Index of a character
	*/
	getSelectionStartFromPointer(e) {
		const mouseOffset = this.canvas.getScenePoint(e).transform(invertTransform(this.calcTransformMatrix())).add(new Point(-this._getLeftOffset(), -this._getTopOffset()));
		let height = 0, charIndex = 0, lineIndex = 0;
		for (let i = 0; i < this._textLines.length; i++) if (height <= mouseOffset.y) {
			height += this.getHeightOfLine(i);
			lineIndex = i;
			if (i > 0) charIndex += this._textLines[i - 1].length + this.missingNewlineOffset(i - 1);
		} else break;
		let width = Math.abs(this._getLineLeftOffset(lineIndex));
		const charLength = this._textLines[lineIndex].length;
		const chars = this.__charBounds[lineIndex];
		for (let j = 0; j < charLength; j++) {
			const charWidth = chars[j].kernedWidth;
			const widthAfter = width + charWidth;
			if (mouseOffset.x <= widthAfter) {
				if (Math.abs(mouseOffset.x - widthAfter) <= Math.abs(mouseOffset.x - width)) charIndex++;
				break;
			}
			width = widthAfter;
			charIndex++;
		}
		return Math.min(this.flipX ? charLength - charIndex : charIndex, this._text.length);
	}
};
//#endregion
export { ITextClickBehavior };

//# sourceMappingURL=ITextClickBehavior.mjs.map