"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var React = require('react');
var Escape = require('react-escape');

var _require = require('pex-geom'),
    Rect = _require.Rect,
    Vec2 = _require.Vec2;

var classNames = require('classnames');

// get Rect of element in viewport coordinates
function viewportRect(element) {
    var rect = element.getBoundingClientRect();
    return new Rect(rect.left, rect.top, rect.width, rect.height);
}

// represents a scheme for attaching a popup rect to an anchor rect
function AttachScheme(name, args) {
    this.name = name;
    this.fits = args.fits;
    this.calcTranslation = args.calcTranslation;
}

// given an anchor edge and a popup edge
// return the delta necessary to align the popup edge on the anchor edge
function align(aedge, pedge) {
    return aedge - pedge;
}

// given an anchor bounds and popup bounds and available space,
// return the delta required to align the popup bounds to anchor bounds according to which side has the most available space
function edgeAlignMaxSpace(amin, amax, pmin, pmax, space) {
    var rspace = space - amax;
    var lspace = amin;
    return rspace <= lspace ? amax - pmax : amin - pmin;
}

// given a delta, popup bounds, and available space
// return a new delta which keeps the popup bounds within the available space
function dclamp(delta, pmin, pmax, space) {
    var edgemax = pmax + delta;
    var edgemin = pmin + delta;
    // nudge back into viewport if any edges fall out of bounds
    if (edgemin < 0) return delta - edgemin;else if (edgemax > space) return delta + (space - edgemax);
    return delta;
}

function clamp(value, pmin, pmax) {
    return value < pmin ? pmin : value > pmax ? pmax : value;
}

function center_y(rect) {
    return (rect.min.y + rect.max.y) * 0.5;
}

function center_x(rect) {
    return (rect.min.x + rect.max.x) * 0.5;
}

function translateRect(rect, translation) {
    if (!rect || !translation) return rect;
    return new Rect(rect.x + translation.x, rect.y + translation.y, rect.width, rect.height);
}

var edgeSchemes = {
    "over": new AttachScheme('over', {
        fits: function fits(arect, psize, viewport) {
            return psize.y <= Math.min(arect.min.y, viewport.y);
        },
        calcTranslation: function calcTranslation(arect, prect, gap, viewport) {
            return new Vec2(dclamp(edgeAlignMaxSpace(arect.min.x, arect.max.x, prect.min.x, prect.max.x, viewport.x), prect.min.x, prect.max.x, viewport.x), dclamp(align(arect.min.y - gap, prect.max.y), prect.min.y, prect.max.y, viewport.y));
        }
    }),
    "under": new AttachScheme('under', {
        fits: function fits(arect, psize, viewport) {
            return psize.y <= viewport.y - arect.max.y;
        },
        calcTranslation: function calcTranslation(arect, prect, gap, viewport) {
            return new Vec2(dclamp(edgeAlignMaxSpace(arect.min.x, arect.max.x, prect.min.x, prect.max.x, viewport.x), prect.min.x, prect.max.x, viewport.x), dclamp(align(arect.max.y + gap, prect.min.y), prect.min.y, prect.max.y, viewport.y));
        }
    }),
    "left": new AttachScheme('left', {
        fits: function fits(arect, psize, viewport) {
            return psize.x <= Math.min(arect.min.x, viewport.x);
        },
        calcTranslation: function calcTranslation(arect, prect, gap, viewport) {
            return new Vec2(dclamp(align(arect.min.x - gap, prect.max.x), prect.min.x, prect.max.x, viewport.x), dclamp(edgeAlignMaxSpace(arect.min.y, arect.max.y, prect.min.y, prect.max.y, viewport.y), prect.min.y, prect.max.y, viewport.y));
        }
    }),
    "right": new AttachScheme('right', {
        fits: function fits(arect, psize, viewport) {
            return psize.x <= viewport.x - arect.max.x;
        },
        calcTranslation: function calcTranslation(arect, prect, gap, viewport) {
            return new Vec2(dclamp(align(arect.max.x + gap, prect.min.x), prect.min.x, prect.max.x, viewport.x), dclamp(edgeAlignMaxSpace(arect.min.y, arect.max.y, prect.min.y, prect.max.y, viewport.y), prect.min.y, prect.max.y, viewport.y));
        }
    })
};

var centerSchemes = {
    "over": new AttachScheme('over', {
        fits: function fits(arect, psize, viewport) {
            return psize.y <= Math.min(arect.min.y, viewport.y);
        },
        calcTranslation: function calcTranslation(arect, prect, gap, viewport) {
            return new Vec2(dclamp(align(center_x(arect), center_x(prect)), prect.min.x, prect.max.x, viewport.x), dclamp(align(arect.min.y - gap, prect.max.y), prect.min.y, prect.max.y, viewport.y));
        }
    }),
    "under": new AttachScheme('under', {
        fits: function fits(arect, psize, viewport) {
            return psize.y <= viewport.y - arect.max.y;
        },
        calcTranslation: function calcTranslation(arect, prect, gap, viewport) {
            return new Vec2(dclamp(align(center_x(arect), center_x(prect)), prect.min.x, prect.max.x, viewport.x), dclamp(align(arect.max.y + gap, prect.min.y), prect.min.y, prect.max.y, viewport.y));
        }
    }),
    "left": new AttachScheme('left', {
        fits: function fits(arect, psize, viewport) {
            return psize.x <= Math.min(arect.min.x, viewport.x);
        },
        calcTranslation: function calcTranslation(arect, prect, gap, viewport) {
            return new Vec2(dclamp(align(arect.min.x - gap, prect.max.x), prect.min.x, prect.max.x, viewport.x), dclamp(align(center_y(arect), center_y(prect)), prect.min.y, prect.max.y, viewport.y));
        }
    }),
    "right": new AttachScheme('right', {
        fits: function fits(arect, psize, viewport) {
            return psize.x <= viewport.x - arect.max.x;
        },
        calcTranslation: function calcTranslation(arect, prect, gap, viewport) {
            return new Vec2(dclamp(align(arect.max.x + gap, prect.min.x), prect.min.x, prect.max.x, viewport.x), dclamp(align(center_y(arect), center_y(prect)), prect.min.y, prect.max.y, viewport.y));
        }
    })
};

var edgeFactors = {
    "over": { v: -1, h: 0, par: function par(rect) {
            return { min: rect.y, max: rect.y + rect.height };
        }, perp: function perp(rect) {
            return { min: rect.x, max: rect.x + rect.width };
        } },
    "under": { v: 1, h: 0, par: function par(rect) {
            return { min: rect.y, max: rect.y + rect.height };
        }, perp: function perp(rect) {
            return { min: rect.x, max: rect.x + rect.width };
        } },
    "left": { v: 0, h: -1, perp: function perp(rect) {
            return { min: rect.y, max: rect.y + rect.height };
        }, par: function par(rect) {
            return { min: rect.x, max: rect.x + rect.width };
        } },
    "right": { v: 0, h: 1, perp: function perp(rect) {
            return { min: rect.y, max: rect.y + rect.height };
        }, par: function par(rect) {
            return { min: rect.x, max: rect.x + rect.width };
        } },
    "unknown": { v: 0, h: 0, perp: function perp() {
            return { min: 0, max: 0 };
        }, par: function par() {
            return { min: 0, max: 0 };
        } }
};

function getSchemes(align) {
    return align == 'center' ? centerSchemes : edgeSchemes;
}

// parses the text of an "attachment" prop into an array of scheme objects
function parseEdgeAlignProps(edges, align) {
    var schemes = getSchemes(align);
    if (!edges) return [schemes.under, schemes.over, schemes.right, schemes.left];
    return edges.split(',').map(function (name) {
        return schemes[name.trim()];
    }).filter(function (s) {
        return s;
    });
}

var styles = {
    required: {
        position: 'absolute'
    },
    default: {
        pointerEvents: 'auto'
    },
    prefab_float: {
        boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.5)',
        backgroundColor: 'white'
    },
    prefab_callout: {
        boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.5)',
        backgroundColor: 'white',
        borderRadius: 5
    }
};

function inflate(r, d) {
    return { min: { x: r.min.x - d, y: r.min.y - d }, max: { x: r.max.x + d, y: r.max.y + d } };
}

var bridgeSize = 20;
// precalculate the breadth (size at base) and elevation (distance to peak from base)
var bridgeBreadth = bridgeSize * 2;
var bridgeElev = bridgeSize;

var bridgeProps = {
    over: function over(anchorRect, popupRect, translation) {
        return {
            height: bridgeSize,
            width: bridgeSize * 2,
            bottom: -bridgeSize,
            left: clamp(anchorRect.min.x - translation.x + anchorRect.width * 0.5 - bridgeElev, 0, popupRect.width - bridgeBreadth),
            transform: 'translate(' + bridgeBreadth * 0.5 + ',' + bridgeElev * 0.5 + '),rotate(0,0,0)'
        };
    },
    under: function under(anchorRect, popupRect, translation) {
        return {
            height: bridgeSize,
            width: bridgeSize * 2,
            top: -bridgeSize,
            left: clamp(anchorRect.min.x - translation.x + anchorRect.width * 0.5 - bridgeElev, 0, popupRect.width - bridgeBreadth),
            transform: 'translate(' + bridgeBreadth * 0.5 + ',' + bridgeElev * 0.5 + '),rotate(180,0,0)'
        };
    },
    left: function left(anchorRect, popupRect, translation) {
        return {
            height: bridgeSize * 2,
            width: bridgeSize,
            right: -bridgeSize,
            top: clamp(anchorRect.min.y - translation.y + anchorRect.height * 0.5 - bridgeElev, 0, popupRect.height - bridgeBreadth),
            transform: 'translate(' + bridgeElev * 0.5 + ',' + bridgeBreadth * 0.5 + '),rotate(-90,0,0)'
        };
    },
    right: function right(anchorRect, popupRect, translation) {
        return {
            height: bridgeSize * 2,
            width: bridgeSize,
            left: -bridgeSize,
            top: clamp(anchorRect.min.y - translation.y + anchorRect.height * 0.5 - bridgeElev, 0, popupRect.height - bridgeBreadth),
            transform: 'translate(' + bridgeElev * 0.5 + ',' + bridgeBreadth * 0.5 + '),rotate(90,0,0)'
        };
    }
};

function makeBridge(state, props) {
    // do not calculate unless we have a position for the anchor and popup
    if (!state.anchorRect) return null;
    // get the relevant values from the state
    var schemeName = state.schemeName,
        anchorRect = state.anchorRect,
        popupRect = state.popupRect,
        translation = state.translation;
    // calculate bridge location

    var _bridgeProps$schemeNa = bridgeProps[schemeName](anchorRect, popupRect, translation),
        transform = _bridgeProps$schemeNa.transform,
        bridgeStyle = _objectWithoutProperties(_bridgeProps$schemeNa, ['transform']);

    var trianglePath = "M -20.5,-11 0,9.5 20.5,-11 Z";

    var trianglePathOutline = "M -19.5,-10 -20,-10 0,10 20,-10 19.5,-10 0,9.5 Z";
    //let trianglePathOutline = "M -20,-10 0,10 20,-10 0,9.5 Z"

    return React.createElement(
        'div',
        {
            className: 'bridge',
            style: _extends({
                position: 'absolute',
                overflow: 'visible'
            }, bridgeStyle) },
        React.createElement(
            'svg',
            {
                style: { width: bridgeStyle.width, height: bridgeStyle.height, overflow: 'visible' } },
            React.createElement(
                'g',
                { transform: transform },
                React.createElement('path', {
                    style: { fill: 'white' },
                    d: trianglePath }),
                React.createElement('path', {
                    style: { fill: '#808080' },
                    d: trianglePathOutline })
            )
        )
    );
}

var FloatAffixed = React.createClass({
    displayName: 'FloatAffixed',

    render: function render() {
        var _props = this.props,
            prefab = _props.prefab,
            edges = _props.edges,
            align = _props.align,
            anchor = _props.anchor,
            bridge = _props.bridge,
            gap = _props.gap,
            render = _props.render,
            children = _props.children,
            className = _props.className,
            style = _props.style,
            props = _objectWithoutProperties(_props, ['prefab', 'edges', 'align', 'anchor', 'bridge', 'gap', 'render', 'children', 'className', 'style']);

        var theme = prefab && styles['prefab_' + prefab];
        var popupStyle = _extends({}, styles.default, theme, style, styles.required, {
            transform: 'translate(' + this.state.translation.x + 'px,' + this.state.translation.y + 'px)'
        });
        var edgeFactor = edgeFactors[this.state.schemeName || "unknown"];
        var translation = this.state.translation;

        if (render) {
            children = render(this.state.schemeName, {
                edges: {
                    anchor: edgeFactor.perp(this.state.anchorRect),
                    popup: edgeFactor.perp(translateRect(this.state.popupRect, translation))
                }
            });
        }
        return React.createElement(
            Escape,
            { ref: this.setEscapeRef, to: 'viewport', style: { overflow: 'hidden' } },
            React.createElement(
                'div',
                _extends({
                    ref: this.setRef,
                    style: popupStyle
                }, props, {
                    className: classNames("float-affixed", this.state.schemeName, className) }),
                this.props.bridge ? makeBridge(this.state, this.props) : null,
                children
            )
        );
    },
    propTypes: {
        prefab: React.PropTypes.string,
        anchor: React.PropTypes.func,
        attachment: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.arrayOf(React.PropTypes.string)]),
        style: React.PropTypes.object
    },
    getInitialState: function getInitialState() {
        return {
            translation: new Vec2(0, 0)
        };
    },
    setRef: function setRef(r) {
        this._popup = r;
        this.reposition(this.props);
    },
    setEscapeRef: function setEscapeRef(r) {
        this.escape = r;
    },
    componentDidMount: function componentDidMount() {
        var _this = this;

        this._schemes = parseEdgeAlignProps(this.props.edges, this.props.align);
        this._anchor = this.props.anchor ? this.props.anchor() : this.escape.escapePoint;
        if (!this._anchor)
            /* eslint no-console: 0 */
            console.error("no anchor supplied for float-affixed");
        this.withAnchorAncestors(function (e) {
            return e.addEventListener("scroll", _this.elementDidScroll);
        });
        window.addEventListener("resize", this.windowDidResize);
        this.reposition(this.props);
    },
    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
        if (this.props.edges != nextProps.edges || this.props.align != nextProps.align) {
            this._schemes = parseEdgeAlignProps(nextProps.edges, nextProps.align);
        }
        if (nextProps != this.props) {
            this.reposition(nextProps);
        }
    },
    componentWillUnmount: function componentWillUnmount() {
        var _this2 = this;

        window.removeEventListener("resize", this.windowDidResize);
        this.withAnchorAncestors(function (e) {
            return e.removeEventListener("scroll", _this2.elementDidScroll);
        });
    },
    withAnchorAncestors: function withAnchorAncestors(cb) {
        if (this._anchor) {
            var e = this._anchor.parentNode;
            while (e != null && e != window) {
                cb(e);
                e = e.parentNode;
            }
        }
    },
    elementDidScroll: function elementDidScroll() {
        this.reposition(this.props);
    },
    windowDidResize: function windowDidResize() {
        this.reposition(this.props);
    },
    reposition: function reposition(props) {
        if (this._popup == null || this._anchor == null) {
            return;
        }
        var prect = viewportRect(this._popup);
        var psize = prect.getSize();
        var arect = viewportRect(this._anchor);
        var gap = (props.gap || 0) + (props.bridge ? bridgeSize : 0);
        var viewport = this.viewportSize();

        var scheme = this.chooseScheme(inflate(arect, gap), psize, viewport);
        var delta = scheme.calcTranslation(arect, prect, gap, viewport);
        /*
        if (!delta || (delta.x === 0 && delta.y === 0))
            return;
        */
        var nextTranslation = this.state.translation.clone().add(delta);
        this.setState({
            translation: nextTranslation,
            schemeName: scheme.name,
            anchorRect: arect,
            popupRect: prect
        });
    },
    chooseScheme: function chooseScheme(arect, psize, viewport) {
        // if there is a scheme, and it still fits, nothing to do
        if (this._scheme && this._scheme.fits(arect, psize, viewport) && this._schemes.indexOf(this._scheme) != -1) return this._scheme;

        // otherwise, find the first scheme that fits
        var scheme = this._schemes.find(function (s) {
            return s.fits(arect, psize, viewport);
        }) || this._scheme || this._schemes[0];
        return this._scheme = scheme;
    },
    viewportSize: function viewportSize() {
        var _escape$getSize = this.escape.getSize(),
            width = _escape$getSize.width,
            height = _escape$getSize.height;

        return new Vec2(width, height);
    }
});

module.exports = FloatAffixed;