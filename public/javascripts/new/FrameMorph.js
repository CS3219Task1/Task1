var Morph = require('./Morph');
var Color = require('./Color');
var Point = require('./Point');

var FrameMorph = Class.create(Morph, {

    // FrameMorph //////////////////////////////////////////////////////////

    // I clip my submorphs at my bounds
    
    initialize: function(aScrollFrame) {
        this.init(aScrollFrame);
    },

    init: function ($super, aScrollFrame) {
        this.scrollFrame = aScrollFrame || null;

        $super();
        this.color = new Color(255, 250, 245);
        this.drawNew();
        this.acceptsDrops = true;

        if (this.scrollFrame) {
            this.isDraggable = false;
            this.noticesTransparentClick = false;
            this.alpha = 0;
        }
    },

    fullBounds: function () {
        var shadow = this.getShadow();
        if (shadow !== null) {
            return this.bounds.merge(shadow.bounds);
        }
        return this.bounds;
    },

    fullImage: function () {
        // use only for shadows
        return this.image;
    },

    fullDrawOn: function (aCanvas, aRect) {
        var rectangle, dirty;
        if (!this.isVisible) {
            return null;
        }
        rectangle = aRect || this.fullBounds();
        dirty = this.bounds.intersect(rectangle);
        if (!dirty.extent().gt(new Point(0, 0))) {
            return null;
        }
        this.drawOn(aCanvas, dirty);
        this.children.forEach(function (child) {
            if (child.instanceOf('ShadowMorph')) {
                child.fullDrawOn(aCanvas, rectangle);
            } else {
                child.fullDrawOn(aCanvas, dirty);
            }
        });
    },

    // FrameMorph scrolling optimization:

    moveBy: function (delta) {
        this.changed();
        this.bounds = this.bounds.translateBy(delta);
        this.children.forEach(function (child) {
            child.silentMoveBy(delta);
        });
        this.changed();
    },

    // FrameMorph scrolling support:

    submorphBounds: function () {
        var result = null;

        if (this.children.length > 0) {
            result = this.children[0].bounds;
            this.children.forEach(function (child) {
                result = result.merge(child.fullBounds());
            });
        }
        return result;
    },

    keepInScrollFrame: function () {
        if (this.scrollFrame === null) {
            return null;
        }
        if (this.left() > this.scrollFrame.left()) {
            this.moveBy(
                new Point(this.scrollFrame.left() - this.left(), 0)
            );
        }
        if (this.right() < this.scrollFrame.right()) {
            this.moveBy(
                new Point(this.scrollFrame.right() - this.right(), 0)
            );
        }
        if (this.top() > this.scrollFrame.top()) {
            this.moveBy(
                new Point(0, this.scrollFrame.top() - this.top())
            );
        }
        if (this.bottom() < this.scrollFrame.bottom()) {
            this.moveBy(
                0,
                new Point(this.scrollFrame.bottom() - this.bottom(), 0)
            );
        }
    },

    adjustBounds: function () {
        var subBounds,
            newBounds,
            myself = this;

        if (this.scrollFrame === null) {
            return null;
        }

        subBounds = this.submorphBounds();
        if (subBounds && (!this.scrollFrame.isTextLineWrapping)) {
            newBounds = subBounds
                .expandBy(this.scrollFrame.padding)
                .growBy(this.scrollFrame.growth)
                .merge(this.scrollFrame.bounds);
        } else {
            newBounds = this.scrollFrame.bounds.copy();
        }
        if (!this.bounds.eq(newBounds)) {
            this.bounds = newBounds;
            this.drawNew();
            this.keepInScrollFrame();
        }

        if (this.scrollFrame.isTextLineWrapping) {
            this.children.forEach(function (morph) {
                if (morph.instanceOf('TextMorph')) {
                    morph.setWidth(myself.width());
                    myself.setHeight(
                        Math.max(morph.height(), myself.scrollFrame.height())
                    );
                }
            });
        }

        this.scrollFrame.adjustScrollBars();
    },

    // FrameMorph dragging & dropping of contents:

    reactToDropOf: function () {
        this.adjustBounds();
    },

    reactToGrabOf: function () {
        this.adjustBounds();
    },

    // FrameMorph duplicating:

    copyRecordingReferences: function ($super, dict) {
        // inherited, see comment in Morph
        var c = $super(dict);
        if (c.frame && dict[this.scrollFrame]) {
            c.frame = (dict[this.scrollFrame]);
        }
        return c;
    },

    // FrameMorph menus:

    developersMenu: function ($super) {
        var menu = $super();
        if (this.children.length > 0) {
            menu.addLine();
            menu.addItem(
                "move all inside...",
                'keepAllSubmorphsWithin',
                'keep all submorphs\nwithin and visible'
            );
        }
        return menu;
    },

    keepAllSubmorphsWithin: function () {
        var myself = this;
        this.children.forEach(function (m) {
            m.keepWithin(myself);
        });
    }
});

FrameMorph.uber = Morph.prototype;
FrameMorph.className = 'FrameMorph';

module.exports = FrameMorph;