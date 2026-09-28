import * as Y from 'yjs';

/**
 * Binding between Quill 1.3.7 and Y.Text for real-time collaboration
 */
export class QuillYjsBinding {
  constructor(quill, ytext) {
    this.quill = quill;
    this.ytext = ytext;
    this.isUpdating = false;

    this.setupQuillListener();
    this.setupYjsListener();
  }

  setupQuillListener() {
    this.handleQuillChange = (delta, oldDelta, source) => {
      if (source === 'user') {
        this.applyQuillChangesToYjs(delta, oldDelta);
      }
    };

    this.quill.on('text-change', this.handleQuillChange);
  }

  setupYjsListener() {
    this.handleYjsChange = event => {
      if (!this.isUpdating) {
        this.applyYjsChangesToQuill(event);
      }
    };

    this.ytext.observe(this.handleYjsChange);
  }

  applyQuillChangesToYjs(delta, oldDelta) {
    if (!delta || !delta.ops) return;

    const ytext = this.ytext;
    let index = 0;
    this.isUpdating = true;

    try {
      for (const op of delta.ops) {
        if (op.retain) {
          index += op.retain;
        } else if (op.insert) {
          const text = typeof op.insert === 'string' ? op.insert : '\n';
          ytext.insert(index, text);
          index += text.length;
        } else if (op.delete) {
          ytext.delete(index, op.delete);
        }
      }
    } catch (error) {
      console.error('Error applying Quill changes to Yjs:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  applyYjsChangesToQuill(event) {
    this.isUpdating = true;

    try {
      if (event.delta.length > 0) {
        const currentContents = this.quill.getContents();
        const selection = this.quill.getSelection();
        
        // Apply changes to Quill
        this.quill.updateContents({ ops: event.delta }, 'silent');
        
        // Restore selection if exists
        if (selection) {
          this.quill.setSelection(selection.index, selection.length, 'silent');
        }
      }
    } catch (error) {
      console.error('Error applying Yjs changes to Quill:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  getContents() {
    return this.ytext.toString();
  }

  setContents(text) {
    this.isUpdating = true;
    try {
      this.ytext.delete(0, this.ytext.length);
      if (text) {
        this.ytext.insert(0, text);
      }
      this.quill.setText(text || '', 'silent');
    } finally {
      this.isUpdating = false;
    }
  }

  destroy() {
    this.quill.off('text-change', this.handleQuillChange);
    this.ytext.unobserve(this.handleYjsChange);
  }
}
