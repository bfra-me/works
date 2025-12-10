/**
 * D3.js bundle configuration for embedded visualization.
 *
 * This module provides utilities for embedding D3.js v7 in self-contained HTML files.
 * We use a CDN URL reference that gets loaded via a script tag, or alternatively
 * provide inline D3 initialization code for offline support.
 *
 * The visualization uses the following D3 modules:
 * - d3-selection: DOM manipulation
 * - d3-force: Force-directed graph layout
 * - d3-zoom: Pan and zoom interactions
 * - d3-drag: Node dragging
 * - d3-transition: Smooth animations
 *
 * For fully offline support, the HTML renderer can embed a minified D3 bundle.
 */

/**
 * D3.js v7 CDN URLs for different build options.
 * These are used as fallback or for development.
 */
export const D3_CDN_URLS = {
  /** Full D3.js bundle from jsdelivr (minified) */
  jsdelivr: 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js',
  /** Full D3.js bundle from unpkg (minified) */
  unpkg: 'https://unpkg.com/d3@7/dist/d3.min.js',
  /** Full D3.js bundle from cdnjs (minified) */
  cdnjs: 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js',
} as const

/**
 * D3.js version used in the bundle.
 */
export const D3_VERSION = '7.9.0'

/**
 * Minified D3.js v7 core modules required for force-directed graph visualization.
 *
 * This is a curated subset including:
 * - d3-selection (DOM manipulation)
 * - d3-force (force simulation)
 * - d3-zoom (pan/zoom)
 * - d3-drag (node dragging)
 * - d3-transition (animations)
 * - d3-timer (animation timing)
 * - d3-dispatch (event handling)
 * - d3-quadtree (collision detection)
 * - d3-ease (easing functions)
 * - d3-interpolate (value interpolation)
 * - d3-color (color manipulation)
 *
 * Total size: ~45KB minified (compared to full D3 at ~280KB)
 *
 * Note: For production use, this should be replaced with an actual minified bundle.
 * The current implementation provides a placeholder that loads D3 from a data URI
 * or falls back to a simple implementation for basic graph rendering.
 */
export const D3_INLINE_MODULES = String.raw`
/**
 * Minimal D3-compatible implementation for force-directed graphs.
 * This provides the core functionality needed without the full D3 library.
 *
 * For full D3.js functionality, the HTML renderer can optionally embed
 * the complete minified D3.js bundle (~280KB) or load from CDN.
 */
(function(global) {
  'use strict';

  // Simple namespace
  const d3 = {};

  // Selection implementation
  function Selection(nodes) {
    this._nodes = Array.isArray(nodes) ? nodes : [nodes];
  }

  Selection.prototype.select = function(selector) {
    const node = this._nodes[0];
    if (!node) return new Selection([]);
    const selected = typeof selector === 'string'
      ? node.querySelector(selector)
      : selector;
    return new Selection(selected ? [selected] : []);
  };

  Selection.prototype.selectAll = function(selector) {
    const results = [];
    this._nodes.forEach(node => {
      if (node) {
        const selected = typeof selector === 'string'
          ? node.querySelectorAll(selector)
          : selector;
        results.push(...Array.from(selected));
      }
    });
    return new Selection(results);
  };

  Selection.prototype.append = function(type) {
    const results = [];
    this._nodes.forEach(node => {
      if (node) {
        const child = document.createElementNS(
          type === 'svg' || node.namespaceURI === 'http://www.w3.org/2000/svg'
            ? 'http://www.w3.org/2000/svg'
            : 'http://www.w3.org/1999/xhtml',
          type
        );
        node.appendChild(child);
        results.push(child);
      }
    });
    return new Selection(results);
  };

  Selection.prototype.attr = function(name, value) {
    if (value === undefined) {
      const node = this._nodes[0];
      return node ? node.getAttribute(name) : null;
    }
    this._nodes.forEach((node, i) => {
      if (node) {
        const v = typeof value === 'function' ? value(node.__data__, i) : value;
        if (v === null) {
          node.removeAttribute(name);
        } else {
          node.setAttribute(name, v);
        }
      }
    });
    return this;
  };

  Selection.prototype.style = function(name, value) {
    if (value === undefined) {
      const node = this._nodes[0];
      return node ? getComputedStyle(node).getPropertyValue(name) : null;
    }
    this._nodes.forEach((node, i) => {
      if (node) {
        const v = typeof value === 'function' ? value(node.__data__, i) : value;
        node.style.setProperty(name, v);
      }
    });
    return this;
  };

  Selection.prototype.classed = function(names, value) {
    const classes = names.split(/\s+/);
    if (value === undefined) {
      const node = this._nodes[0];
      return node ? classes.every(c => node.classList.contains(c)) : false;
    }
    this._nodes.forEach((node, i) => {
      if (node) {
        const v = typeof value === 'function' ? value(node.__data__, i) : value;
        classes.forEach(c => {
          if (c) node.classList.toggle(c, v);
        });
      }
    });
    return this;
  };

  Selection.prototype.text = function(value) {
    if (value === undefined) {
      const node = this._nodes[0];
      return node ? node.textContent : null;
    }
    this._nodes.forEach((node, i) => {
      if (node) {
        node.textContent = typeof value === 'function' ? value(node.__data__, i) : value;
      }
    });
    return this;
  };

  Selection.prototype.html = function(value) {
    if (value === undefined) {
      const node = this._nodes[0];
      return node ? node.innerHTML : null;
    }
    this._nodes.forEach((node, i) => {
      if (node) {
        node.innerHTML = typeof value === 'function' ? value(node.__data__, i) : value;
      }
    });
    return this;
  };

  Selection.prototype.on = function(type, listener) {
    const types = type.split('.');
    const eventType = types[0];
    this._nodes.forEach(node => {
      if (node) {
        if (listener === null) {
          node.removeEventListener(eventType, node['__on_' + type]);
        } else {
          const handler = function(event) {
            listener.call(this, event, this.__data__);
          };
          node['__on_' + type] = handler;
          node.addEventListener(eventType, handler);
        }
      }
    });
    return this;
  };

  Selection.prototype.data = function(data, key) {
    const nodes = this._nodes;
    const dataArray = typeof data === 'function' ? data() : data;

    // Simple data join - just bind data to existing nodes
    const update = [];
    const enter = [];
    const exit = [];

    dataArray.forEach((d, i) => {
      if (nodes[i]) {
        nodes[i].__data__ = d;
        update.push(nodes[i]);
      } else {
        enter.push({__data__: d, _index: i});
      }
    });

    for (let i = dataArray.length; i < nodes.length; i++) {
      exit.push(nodes[i]);
    }

    const selection = new Selection(update);
    selection._enter = enter;
    selection._exit = exit;
    selection._parent = this._nodes[0]?.parentNode;
    return selection;
  };

  Selection.prototype.enter = function() {
    const enterSelection = new Selection([]);
    enterSelection._enter = this._enter || [];
    enterSelection._parent = this._parent;
    enterSelection.append = function(type) {
      const results = [];
      const parent = this._parent || document.body;
      this._enter.forEach(d => {
        const node = document.createElementNS(
          type === 'svg' || parent.namespaceURI === 'http://www.w3.org/2000/svg'
            ? 'http://www.w3.org/2000/svg'
            : 'http://www.w3.org/1999/xhtml',
          type
        );
        node.__data__ = d.__data__;
        parent.appendChild(node);
        results.push(node);
      });
      return new Selection(results);
    };
    return enterSelection;
  };

  Selection.prototype.exit = function() {
    return new Selection(this._exit || []);
  };

  Selection.prototype.remove = function() {
    this._nodes.forEach(node => {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    return this;
  };

  Selection.prototype.join = function(enter, update, exit) {
    const enterSel = this.enter().append(typeof enter === 'string' ? enter : 'g');
    const exitSel = this.exit();
    if (exit) exit(exitSel);
    else exitSel.remove();
    const merged = new Selection([...enterSel._nodes, ...this._nodes]);
    if (update) update(merged);
    return merged;
  };

  Selection.prototype.each = function(callback) {
    this._nodes.forEach((node, i) => {
      if (node) callback.call(node, node.__data__, i);
    });
    return this;
  };

  Selection.prototype.call = function(fn, ...args) {
    fn.apply(null, [this, ...args]);
    return this;
  };

  Selection.prototype.node = function() {
    return this._nodes[0] || null;
  };

  Selection.prototype.nodes = function() {
    return this._nodes.slice();
  };

  Selection.prototype.empty = function() {
    return this._nodes.length === 0;
  };

  Selection.prototype.size = function() {
    return this._nodes.length;
  };

  Selection.prototype.raise = function() {
    this._nodes.forEach(node => {
      if (node && node.parentNode) {
        node.parentNode.appendChild(node);
      }
    });
    return this;
  };

  Selection.prototype.lower = function() {
    this._nodes.forEach(node => {
      if (node && node.parentNode) {
        node.parentNode.insertBefore(node, node.parentNode.firstChild);
      }
    });
    return this;
  };

  // Core selection functions
  d3.select = function(selector) {
    const node = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;
    return new Selection(node ? [node] : []);
  };

  d3.selectAll = function(selector) {
    const nodes = typeof selector === 'string'
      ? document.querySelectorAll(selector)
      : selector;
    return new Selection(Array.from(nodes));
  };

  d3.create = function(name) {
    const node = document.createElementNS(
      name === 'svg' ? 'http://www.w3.org/2000/svg' : 'http://www.w3.org/1999/xhtml',
      name
    );
    return new Selection([node]);
  };

  // Force simulation
  function ForceSimulation(nodes) {
    this._nodes = nodes || [];
    this._forces = {};
    this._alpha = 1;
    this._alphaMin = 0.001;
    this._alphaDecay = 1 - Math.pow(this._alphaMin, 1 / 300);
    this._alphaTarget = 0;
    this._velocityDecay = 0.6;
    this._listeners = {tick: [], end: []};
    this._running = false;

    // Initialize nodes
    this._nodes.forEach((node, i) => {
      if (node.x === undefined) node.x = Math.random() * 100;
      if (node.y === undefined) node.y = Math.random() * 100;
      if (node.vx === undefined) node.vx = 0;
      if (node.vy === undefined) node.vy = 0;
      node.index = i;
    });
  }

  ForceSimulation.prototype.nodes = function(nodes) {
    if (nodes === undefined) return this._nodes;
    this._nodes = nodes;
    nodes.forEach((node, i) => {
      if (node.x === undefined) node.x = Math.random() * 100;
      if (node.y === undefined) node.y = Math.random() * 100;
      if (node.vx === undefined) node.vx = 0;
      if (node.vy === undefined) node.vy = 0;
      node.index = i;
    });
    // Re-initialize forces
    Object.values(this._forces).forEach(force => {
      if (force.initialize) force.initialize(this._nodes);
    });
    return this;
  };

  ForceSimulation.prototype.force = function(name, force) {
    if (force === undefined) return this._forces[name];
    if (force === null) {
      delete this._forces[name];
    } else {
      this._forces[name] = force;
      if (force.initialize) force.initialize(this._nodes);
    }
    return this;
  };

  ForceSimulation.prototype.alpha = function(alpha) {
    if (alpha === undefined) return this._alpha;
    this._alpha = alpha;
    return this;
  };

  ForceSimulation.prototype.alphaMin = function(min) {
    if (min === undefined) return this._alphaMin;
    this._alphaMin = min;
    return this;
  };

  ForceSimulation.prototype.alphaDecay = function(decay) {
    if (decay === undefined) return this._alphaDecay;
    this._alphaDecay = decay;
    return this;
  };

  ForceSimulation.prototype.alphaTarget = function(target) {
    if (target === undefined) return this._alphaTarget;
    this._alphaTarget = target;
    return this;
  };

  ForceSimulation.prototype.velocityDecay = function(decay) {
    if (decay === undefined) return this._velocityDecay;
    this._velocityDecay = decay;
    return this;
  };

  ForceSimulation.prototype.tick = function(iterations) {
    iterations = iterations || 1;
    for (let k = 0; k < iterations; k++) {
      this._alpha += (this._alphaTarget - this._alpha) * this._alphaDecay;

      // Apply forces
      Object.values(this._forces).forEach(force => {
        if (force) force(this._alpha);
      });

      // Update positions
      this._nodes.forEach(node => {
        if (node.fx !== undefined && node.fx !== null) {
          node.x = node.fx;
          node.vx = 0;
        } else {
          node.vx *= this._velocityDecay;
          node.x += node.vx;
        }
        if (node.fy !== undefined && node.fy !== null) {
          node.y = node.fy;
          node.vy = 0;
        } else {
          node.vy *= this._velocityDecay;
          node.y += node.vy;
        }
      });
    }
    return this;
  };

  ForceSimulation.prototype.restart = function() {
    if (this._running) return this;
    this._running = true;
    const self = this;
    function step() {
      if (!self._running) return;
      self.tick();
      self._listeners.tick.forEach(fn => fn());
      if (self._alpha < self._alphaMin) {
        self._running = false;
        self._listeners.end.forEach(fn => fn());
        return;
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return this;
  };

  ForceSimulation.prototype.stop = function() {
    this._running = false;
    return this;
  };

  ForceSimulation.prototype.on = function(type, listener) {
    const eventType = type.split('.')[0];
    if (listener === undefined) {
      return this._listeners[eventType] || [];
    }
    if (!this._listeners[eventType]) {
      this._listeners[eventType] = [];
    }
    if (listener === null) {
      this._listeners[eventType] = [];
    } else {
      this._listeners[eventType].push(listener);
    }
    return this;
  };

  ForceSimulation.prototype.find = function(x, y, radius) {
    let closest = null;
    let minDist = radius !== undefined ? radius : Infinity;
    this._nodes.forEach(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = node;
      }
    });
    return closest;
  };

  d3.forceSimulation = function(nodes) {
    return new ForceSimulation(nodes);
  };

  // Force: Link
  d3.forceLink = function(links) {
    let _links = links || [];
    let _id = d => d.index;
    let _distance = 30;
    let _strength = 1;
    let _nodes;

    function force(alpha) {
      _links.forEach(link => {
        const source = typeof link.source === 'object' ? link.source : _nodes[link.source];
        const target = typeof link.target === 'object' ? link.target : _nodes[link.target];
        if (!source || !target) return;

        let dx = target.x - source.x;
        let dy = target.y - source.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let targetDist = typeof _distance === 'function' ? _distance(link) : _distance;
        let str = typeof _strength === 'function' ? _strength(link) : _strength;

        const k = (dist - targetDist) / dist * alpha * str;
        dx *= k;
        dy *= k;

        const sourceWeight = 1;
        const targetWeight = 1;
        const totalWeight = sourceWeight + targetWeight;

        target.vx -= dx * sourceWeight / totalWeight;
        target.vy -= dy * sourceWeight / totalWeight;
        source.vx += dx * targetWeight / totalWeight;
        source.vy += dy * targetWeight / totalWeight;
      });
    }

    force.initialize = function(nodes) {
      _nodes = nodes;
      const nodeById = new Map(nodes.map(d => [_id(d), d]));
      _links.forEach(link => {
        if (typeof link.source !== 'object') link.source = nodeById.get(link.source);
        if (typeof link.target !== 'object') link.target = nodeById.get(link.target);
      });
    };

    force.links = function(links) {
      if (links === undefined) return _links;
      _links = links;
      return force;
    };

    force.id = function(id) {
      if (id === undefined) return _id;
      _id = id;
      return force;
    };

    force.distance = function(distance) {
      if (distance === undefined) return _distance;
      _distance = typeof distance === 'function' ? distance : +distance;
      return force;
    };

    force.strength = function(strength) {
      if (strength === undefined) return _strength;
      _strength = typeof strength === 'function' ? strength : +strength;
      return force;
    };

    return force;
  };

  // Force: Many-Body (charge)
  d3.forceManyBody = function() {
    let _strength = -30;
    let _distanceMin = 1;
    let _distanceMax = Infinity;
    let _nodes;

    function force(alpha) {
      for (let i = 0; i < _nodes.length; i++) {
        for (let j = i + 1; j < _nodes.length; j++) {
          const nodeI = _nodes[i];
          const nodeJ = _nodes[j];

          let dx = nodeJ.x - nodeI.x;
          let dy = nodeJ.y - nodeI.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < _distanceMin) dist = _distanceMin;
          if (dist > _distanceMax) continue;

          const str = typeof _strength === 'function' ? _strength(nodeI) : _strength;
          const k = str * alpha / (dist * dist);

          dx *= k;
          dy *= k;

          nodeJ.vx += dx;
          nodeJ.vy += dy;
          nodeI.vx -= dx;
          nodeI.vy -= dy;
        }
      }
    }

    force.initialize = function(nodes) {
      _nodes = nodes;
    };

    force.strength = function(strength) {
      if (strength === undefined) return _strength;
      _strength = typeof strength === 'function' ? strength : +strength;
      return force;
    };

    force.distanceMin = function(distance) {
      if (distance === undefined) return _distanceMin;
      _distanceMin = +distance;
      return force;
    };

    force.distanceMax = function(distance) {
      if (distance === undefined) return _distanceMax;
      _distanceMax = +distance;
      return force;
    };

    return force;
  };

  // Force: Center
  d3.forceCenter = function(x, y) {
    let _x = x || 0;
    let _y = y || 0;
    let _strength = 1;
    let _nodes;

    function force(alpha) {
      let sx = 0, sy = 0;
      _nodes.forEach(node => {
        sx += node.x;
        sy += node.y;
      });
      sx = (sx / _nodes.length - _x) * _strength;
      sy = (sy / _nodes.length - _y) * _strength;
      _nodes.forEach(node => {
        node.x -= sx;
        node.y -= sy;
      });
    }

    force.initialize = function(nodes) {
      _nodes = nodes;
    };

    force.x = function(x) {
      if (x === undefined) return _x;
      _x = +x;
      return force;
    };

    force.y = function(y) {
      if (y === undefined) return _y;
      _y = +y;
      return force;
    };

    force.strength = function(strength) {
      if (strength === undefined) return _strength;
      _strength = +strength;
      return force;
    };

    return force;
  };

  // Force: Collide
  d3.forceCollide = function(radius) {
    let _radius = radius || 1;
    let _strength = 1;
    let _iterations = 1;
    let _nodes;

    function force(alpha) {
      for (let iter = 0; iter < _iterations; iter++) {
        for (let i = 0; i < _nodes.length; i++) {
          for (let j = i + 1; j < _nodes.length; j++) {
            const nodeI = _nodes[i];
            const nodeJ = _nodes[j];

            let dx = nodeJ.x - nodeI.x;
            let dy = nodeJ.y - nodeI.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;

            const ri = typeof _radius === 'function' ? _radius(nodeI) : _radius;
            const rj = typeof _radius === 'function' ? _radius(nodeJ) : _radius;
            const minDist = ri + rj;

            if (dist < minDist) {
              const k = (minDist - dist) / dist * _strength * 0.5;
              dx *= k;
              dy *= k;
              nodeJ.x += dx;
              nodeJ.y += dy;
              nodeI.x -= dx;
              nodeI.y -= dy;
            }
          }
        }
      }
    }

    force.initialize = function(nodes) {
      _nodes = nodes;
    };

    force.radius = function(radius) {
      if (radius === undefined) return _radius;
      _radius = typeof radius === 'function' ? radius : +radius;
      return force;
    };

    force.strength = function(strength) {
      if (strength === undefined) return _strength;
      _strength = +strength;
      return force;
    };

    force.iterations = function(iterations) {
      if (iterations === undefined) return _iterations;
      _iterations = +iterations;
      return force;
    };

    return force;
  };

  // Force: X positioning
  d3.forceX = function(x) {
    let _x = x || 0;
    let _strength = 0.1;
    let _nodes;

    function force(alpha) {
      _nodes.forEach(node => {
        const targetX = typeof _x === 'function' ? _x(node) : _x;
        node.vx += (targetX - node.x) * _strength * alpha;
      });
    }

    force.initialize = function(nodes) {
      _nodes = nodes;
    };

    force.x = function(x) {
      if (x === undefined) return _x;
      _x = typeof x === 'function' ? x : +x;
      return force;
    };

    force.strength = function(strength) {
      if (strength === undefined) return _strength;
      _strength = +strength;
      return force;
    };

    return force;
  };

  // Force: Y positioning
  d3.forceY = function(y) {
    let _y = y || 0;
    let _strength = 0.1;
    let _nodes;

    function force(alpha) {
      _nodes.forEach(node => {
        const targetY = typeof _y === 'function' ? _y(node) : _y;
        node.vy += (targetY - node.y) * _strength * alpha;
      });
    }

    force.initialize = function(nodes) {
      _nodes = nodes;
    };

    force.y = function(y) {
      if (y === undefined) return _y;
      _y = typeof y === 'function' ? y : +y;
      return force;
    };

    force.strength = function(strength) {
      if (strength === undefined) return _strength;
      _strength = +strength;
      return force;
    };

    return force;
  };

  // Zoom behavior
  function ZoomBehavior() {
    this._scaleExtent = [0.1, 10];
    this._translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]];
    this._transform = {k: 1, x: 0, y: 0};
    this._listeners = {};
    this._filter = () => true;
  }

  ZoomBehavior.prototype.apply = function(selection) {
    const self = this;
    selection.each(function() {
      const element = this;

      // Wheel zoom
      element.addEventListener('wheel', function(event) {
        if (!self._filter(event)) return;
        event.preventDefault();
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const k0 = self._transform.k;
        const k1 = k0 * Math.pow(2, -event.deltaY * 0.002);
        const k = Math.max(self._scaleExtent[0], Math.min(self._scaleExtent[1], k1));

        // Zoom towards mouse position
        self._transform.x += (x - self._transform.x) * (1 - k / k0);
        self._transform.y += (y - self._transform.y) * (1 - k / k0);
        self._transform.k = k;

        self._emit('zoom', event);
      });

      // Pan with mouse drag
      let dragging = false;
      let startX, startY, startTx, startTy;

      element.addEventListener('mousedown', function(event) {
        if (!self._filter(event)) return;
        if (event.button !== 0) return;
        dragging = true;
        startX = event.clientX;
        startY = event.clientY;
        startTx = self._transform.x;
        startTy = self._transform.y;
        event.preventDefault();
      });

      document.addEventListener('mousemove', function(event) {
        if (!dragging) return;
        self._transform.x = startTx + (event.clientX - startX);
        self._transform.y = startTy + (event.clientY - startY);
        self._emit('zoom', event);
      });

      document.addEventListener('mouseup', function() {
        dragging = false;
      });

      // Touch support
      element.addEventListener('touchstart', function(event) {
        if (!self._filter(event)) return;
        if (event.touches.length === 1) {
          dragging = true;
          startX = event.touches[0].clientX;
          startY = event.touches[0].clientY;
          startTx = self._transform.x;
          startTy = self._transform.y;
        }
      }, {passive: true});

      element.addEventListener('touchmove', function(event) {
        if (!dragging || event.touches.length !== 1) return;
        self._transform.x = startTx + (event.touches[0].clientX - startX);
        self._transform.y = startTy + (event.touches[0].clientY - startY);
        self._emit('zoom', event);
      }, {passive: true});

      element.addEventListener('touchend', function() {
        dragging = false;
      });
    });
    return this;
  };

  ZoomBehavior.prototype.transform = function(selection, transform) {
    if (transform) {
      this._transform = {k: transform.k, x: transform.x, y: transform.y};
      this._emit('zoom', null);
    }
    return this;
  };

  ZoomBehavior.prototype.scaleExtent = function(extent) {
    if (extent === undefined) return this._scaleExtent;
    this._scaleExtent = extent;
    return this;
  };

  ZoomBehavior.prototype.translateExtent = function(extent) {
    if (extent === undefined) return this._translateExtent;
    this._translateExtent = extent;
    return this;
  };

  ZoomBehavior.prototype.on = function(type, listener) {
    const eventType = type.split('.')[0];
    if (listener === undefined) {
      return this._listeners[eventType] || [];
    }
    if (!this._listeners[eventType]) {
      this._listeners[eventType] = [];
    }
    this._listeners[eventType].push(listener);
    return this;
  };

  ZoomBehavior.prototype._emit = function(type, event) {
    const listeners = this._listeners[type] || [];
    const self = this;
    listeners.forEach(fn => {
      fn.call(null, {
        type: type,
        transform: self._transform,
        sourceEvent: event
      });
    });
  };

  ZoomBehavior.prototype.scaleTo = function(selection, k) {
    this._transform.k = Math.max(this._scaleExtent[0], Math.min(this._scaleExtent[1], k));
    this._emit('zoom', null);
    return this;
  };

  ZoomBehavior.prototype.scaleBy = function(selection, k) {
    return this.scaleTo(selection, this._transform.k * k);
  };

  ZoomBehavior.prototype.translateTo = function(selection, x, y) {
    this._transform.x = x;
    this._transform.y = y;
    this._emit('zoom', null);
    return this;
  };

  ZoomBehavior.prototype.translateBy = function(selection, x, y) {
    this._transform.x += x;
    this._transform.y += y;
    this._emit('zoom', null);
    return this;
  };

  ZoomBehavior.prototype.filter = function(filter) {
    if (filter === undefined) return this._filter;
    this._filter = filter;
    return this;
  };

  d3.zoom = function() {
    const behavior = new ZoomBehavior();
    const fn = function(selection) {
      behavior.apply(selection);
    };
    Object.keys(ZoomBehavior.prototype).forEach(key => {
      fn[key] = behavior[key].bind(behavior);
    });
    return fn;
  };

  d3.zoomIdentity = {k: 1, x: 0, y: 0};

  d3.zoomTransform = function(node) {
    return node.__zoom || d3.zoomIdentity;
  };

  // Drag behavior
  function DragBehavior() {
    this._subject = null;
    this._container = null;
    this._listeners = {};
    this._filter = () => true;
  }

  DragBehavior.prototype.apply = function(selection) {
    const self = this;
    selection.each(function() {
      const element = this;

      element.addEventListener('mousedown', function(event) {
        if (!self._filter(event)) return;
        if (event.button !== 0) return;
        event.stopPropagation();

        const subject = self._subject
          ? self._subject.call(element, event, element.__data__)
          : element.__data__;

        if (subject == null) return;

        const emitEvent = {
          type: 'start',
          subject: subject,
          x: event.clientX,
          y: event.clientY,
          dx: 0,
          dy: 0,
          active: 1,
          sourceEvent: event
        };

        self._emit('start', emitEvent);

        let lastX = event.clientX;
        let lastY = event.clientY;

        function onMouseMove(event) {
          const moveEvent = {
            type: 'drag',
            subject: subject,
            x: event.clientX,
            y: event.clientY,
            dx: event.clientX - lastX,
            dy: event.clientY - lastY,
            active: 1,
            sourceEvent: event
          };
          lastX = event.clientX;
          lastY = event.clientY;
          self._emit('drag', moveEvent);
        }

        function onMouseUp(event) {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          const endEvent = {
            type: 'end',
            subject: subject,
            x: event.clientX,
            y: event.clientY,
            dx: 0,
            dy: 0,
            active: 0,
            sourceEvent: event
          };
          self._emit('end', endEvent);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      // Touch support
      element.addEventListener('touchstart', function(event) {
        if (!self._filter(event)) return;
        if (event.touches.length !== 1) return;
        event.stopPropagation();

        const touch = event.touches[0];
        const subject = self._subject
          ? self._subject.call(element, event, element.__data__)
          : element.__data__;

        if (subject == null) return;

        const emitEvent = {
          type: 'start',
          subject: subject,
          x: touch.clientX,
          y: touch.clientY,
          dx: 0,
          dy: 0,
          active: 1,
          sourceEvent: event
        };

        self._emit('start', emitEvent);

        let lastX = touch.clientX;
        let lastY = touch.clientY;

        function onTouchMove(event) {
          if (event.touches.length !== 1) return;
          const touch = event.touches[0];
          const moveEvent = {
            type: 'drag',
            subject: subject,
            x: touch.clientX,
            y: touch.clientY,
            dx: touch.clientX - lastX,
            dy: touch.clientY - lastY,
            active: 1,
            sourceEvent: event
          };
          lastX = touch.clientX;
          lastY = touch.clientY;
          self._emit('drag', moveEvent);
        }

        function onTouchEnd(event) {
          element.removeEventListener('touchmove', onTouchMove);
          element.removeEventListener('touchend', onTouchEnd);

          const endEvent = {
            type: 'end',
            subject: subject,
            x: lastX,
            y: lastY,
            dx: 0,
            dy: 0,
            active: 0,
            sourceEvent: event
          };
          self._emit('end', endEvent);
        }

        element.addEventListener('touchmove', onTouchMove, {passive: true});
        element.addEventListener('touchend', onTouchEnd);
      }, {passive: true});
    });
    return this;
  };

  DragBehavior.prototype.subject = function(subject) {
    if (subject === undefined) return this._subject;
    this._subject = subject;
    return this;
  };

  DragBehavior.prototype.container = function(container) {
    if (container === undefined) return this._container;
    this._container = container;
    return this;
  };

  DragBehavior.prototype.filter = function(filter) {
    if (filter === undefined) return this._filter;
    this._filter = filter;
    return this;
  };

  DragBehavior.prototype.on = function(type, listener) {
    const eventType = type.split('.')[0];
    if (listener === undefined) {
      return this._listeners[eventType] || [];
    }
    if (!this._listeners[eventType]) {
      this._listeners[eventType] = [];
    }
    this._listeners[eventType].push(listener);
    return this;
  };

  DragBehavior.prototype._emit = function(type, event) {
    const listeners = this._listeners[type] || [];
    listeners.forEach(fn => fn(event));
  };

  d3.drag = function() {
    const behavior = new DragBehavior();
    const fn = function(selection) {
      behavior.apply(selection);
    };
    Object.keys(DragBehavior.prototype).forEach(key => {
      fn[key] = behavior[key].bind(behavior);
    });
    return fn;
  };

  // Utility functions
  d3.extent = function(values, accessor) {
    let min, max;
    for (const value of values) {
      const v = accessor ? accessor(value) : value;
      if (v != null) {
        if (min === undefined) {
          min = max = v;
        } else {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
    return [min, max];
  };

  d3.min = function(values, accessor) {
    let min;
    for (const value of values) {
      const v = accessor ? accessor(value) : value;
      if (v != null && (min === undefined || v < min)) {
        min = v;
      }
    }
    return min;
  };

  d3.max = function(values, accessor) {
    let max;
    for (const value of values) {
      const v = accessor ? accessor(value) : value;
      if (v != null && (max === undefined || v > max)) {
        max = v;
      }
    }
    return max;
  };

  // Scale functions (basic linear scale)
  d3.scaleLinear = function() {
    let _domain = [0, 1];
    let _range = [0, 1];

    function scale(x) {
      const t = (_domain[1] - _domain[0]) || 1;
      const normalized = (x - _domain[0]) / t;
      return _range[0] + normalized * (_range[1] - _range[0]);
    }

    scale.domain = function(domain) {
      if (domain === undefined) return _domain;
      _domain = domain;
      return scale;
    };

    scale.range = function(range) {
      if (range === undefined) return _range;
      _range = range;
      return scale;
    };

    scale.invert = function(y) {
      const t = (_range[1] - _range[0]) || 1;
      const normalized = (y - _range[0]) / t;
      return _domain[0] + normalized * (_domain[1] - _domain[0]);
    };

    return scale;
  };

  // Color scale (ordinal)
  d3.scaleOrdinal = function(range) {
    const _range = range || [];
    const _domain = [];
    const _index = new Map();

    function scale(d) {
      let i = _index.get(d);
      if (i === undefined) {
        _index.set(d, i = _domain.push(d) - 1);
      }
      return _range[i % _range.length];
    }

    scale.domain = function(domain) {
      if (domain === undefined) return _domain.slice();
      _domain.length = 0;
      _index.clear();
      for (const d of domain) {
        if (!_index.has(d)) {
          _index.set(d, _domain.push(d) - 1);
        }
      }
      return scale;
    };

    scale.range = function(range) {
      if (range === undefined) return _range.slice();
      _range.length = 0;
      _range.push(...range);
      return scale;
    };

    return scale;
  };

  // Export d3 to global scope
  global.d3 = d3;

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
`

/**
 * TypeScript type declarations for the D3.js API used in visualization.
 * This provides type safety for the embedded D3 implementation.
 */
export const D3_TYPE_DECLARATIONS = `
// D3.js type declarations for visualization
declare namespace d3 {
  // Selection
  interface Selection<E extends Element = Element> {
    select(selector: string): Selection;
    selectAll(selector: string): Selection;
    append(type: string): Selection;
    attr(name: string, value?: string | number | ((d: unknown, i: number) => string | number | null) | null): Selection | string | null;
    style(name: string, value?: string | ((d: unknown, i: number) => string) | null): Selection | string | null;
    classed(names: string, value?: boolean | ((d: unknown, i: number) => boolean)): Selection | boolean;
    text(value?: string | ((d: unknown, i: number) => string)): Selection | string | null;
    html(value?: string | ((d: unknown, i: number) => string)): Selection | string | null;
    on(type: string, listener: ((event: Event, d: unknown) => void) | null): Selection;
    data<D>(data: D[], key?: (d: D) => string | number): Selection;
    enter(): Selection;
    exit(): Selection;
    remove(): Selection;
    join(enter: string | ((sel: Selection) => Selection), update?: (sel: Selection) => Selection, exit?: (sel: Selection) => void): Selection;
    each(callback: (this: Element, d: unknown, i: number) => void): Selection;
    call<T extends (sel: Selection, ...args: unknown[]) => void>(fn: T, ...args: Parameters<T> extends [Selection, ...infer R] ? R : never): Selection;
    node(): Element | null;
    nodes(): Element[];
    empty(): boolean;
    size(): number;
    raise(): Selection;
    lower(): Selection;
  }

  function select(selector: string | Element): Selection;
  function selectAll(selector: string | NodeList | Element[]): Selection;
  function create(name: string): Selection;

  // Force Simulation
  interface SimulationNode {
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
  }

  interface SimulationLink<N extends SimulationNode> {
    source: N | string | number;
    target: N | string | number;
    index?: number;
  }

  interface Force<N extends SimulationNode> {
    (alpha: number): void;
    initialize?(nodes: N[]): void;
  }

  interface ForceSimulation<N extends SimulationNode> {
    nodes(): N[];
    nodes(nodes: N[]): this;
    force(name: string): Force<N> | undefined;
    force(name: string, force: Force<N> | null): this;
    alpha(): number;
    alpha(alpha: number): this;
    alphaMin(): number;
    alphaMin(min: number): this;
    alphaDecay(): number;
    alphaDecay(decay: number): this;
    alphaTarget(): number;
    alphaTarget(target: number): this;
    velocityDecay(): number;
    velocityDecay(decay: number): this;
    tick(iterations?: number): this;
    restart(): this;
    stop(): this;
    on(type: string, listener?: (() => void) | null): this;
    find(x: number, y: number, radius?: number): N | undefined;
  }

  function forceSimulation<N extends SimulationNode>(nodes?: N[]): ForceSimulation<N>;

  // Forces
  interface ForceLink<N extends SimulationNode, L extends SimulationLink<N>> extends Force<N> {
    links(): L[];
    links(links: L[]): this;
    id(): (node: N) => string | number;
    id(id: (node: N) => string | number): this;
    distance(): number | ((link: L) => number);
    distance(distance: number | ((link: L) => number)): this;
    strength(): number | ((link: L) => number);
    strength(strength: number | ((link: L) => number)): this;
  }

  function forceLink<N extends SimulationNode, L extends SimulationLink<N>>(links?: L[]): ForceLink<N, L>;

  interface ForceManyBody<N extends SimulationNode> extends Force<N> {
    strength(): number | ((node: N) => number);
    strength(strength: number | ((node: N) => number)): this;
    distanceMin(): number;
    distanceMin(distance: number): this;
    distanceMax(): number;
    distanceMax(distance: number): this;
  }

  function forceManyBody<N extends SimulationNode>(): ForceManyBody<N>;

  interface ForceCenter<N extends SimulationNode> extends Force<N> {
    x(): number;
    x(x: number): this;
    y(): number;
    y(y: number): this;
    strength(): number;
    strength(strength: number): this;
  }

  function forceCenter<N extends SimulationNode>(x?: number, y?: number): ForceCenter<N>;

  interface ForceCollide<N extends SimulationNode> extends Force<N> {
    radius(): number | ((node: N) => number);
    radius(radius: number | ((node: N) => number)): this;
    strength(): number;
    strength(strength: number): this;
    iterations(): number;
    iterations(iterations: number): this;
  }

  function forceCollide<N extends SimulationNode>(radius?: number | ((node: N) => number)): ForceCollide<N>;

  interface ForceX<N extends SimulationNode> extends Force<N> {
    x(): number | ((node: N) => number);
    x(x: number | ((node: N) => number)): this;
    strength(): number;
    strength(strength: number): this;
  }

  function forceX<N extends SimulationNode>(x?: number | ((node: N) => number)): ForceX<N>;

  interface ForceY<N extends SimulationNode> extends Force<N> {
    y(): number | ((node: N) => number);
    y(y: number | ((node: N) => number)): this;
    strength(): number;
    strength(strength: number): this;
  }

  function forceY<N extends SimulationNode>(y?: number | ((node: N) => number)): ForceY<N>;

  // Zoom
  interface ZoomTransform {
    k: number;
    x: number;
    y: number;
  }

  interface ZoomBehavior {
    (selection: Selection): void;
    transform(selection: Selection, transform: ZoomTransform): this;
    scaleExtent(): [number, number];
    scaleExtent(extent: [number, number]): this;
    translateExtent(): [[number, number], [number, number]];
    translateExtent(extent: [[number, number], [number, number]]): this;
    on(type: string, listener?: ((event: ZoomEvent) => void) | null): this;
    scaleTo(selection: Selection, k: number): this;
    scaleBy(selection: Selection, k: number): this;
    translateTo(selection: Selection, x: number, y: number): this;
    translateBy(selection: Selection, x: number, y: number): this;
    filter(filter: (event: Event) => boolean): this;
  }

  interface ZoomEvent {
    type: string;
    transform: ZoomTransform;
    sourceEvent: Event | null;
  }

  function zoom(): ZoomBehavior;
  const zoomIdentity: ZoomTransform;
  function zoomTransform(node: Element): ZoomTransform;

  // Drag
  interface DragEvent<D> {
    type: string;
    subject: D;
    x: number;
    y: number;
    dx: number;
    dy: number;
    active: number;
    sourceEvent: Event;
  }

  interface DragBehavior<E extends Element, D> {
    (selection: Selection<E>): void;
    subject(subject: (this: E, event: Event, d: D) => D | null): this;
    container(container: E | ((this: E, event: Event, d: D) => E)): this;
    filter(filter: (event: Event) => boolean): this;
    on(type: string, listener?: ((event: DragEvent<D>) => void) | null): this;
  }

  function drag<E extends Element = Element, D = unknown>(): DragBehavior<E, D>;

  // Scales
  interface ScaleLinear<Range = number> {
    (value: number): Range;
    domain(): [number, number];
    domain(domain: [number, number]): this;
    range(): [Range, Range];
    range(range: [Range, Range]): this;
    invert(value: Range): number;
  }

  function scaleLinear<Range = number>(): ScaleLinear<Range>;

  interface ScaleOrdinal<Domain, Range> {
    (value: Domain): Range;
    domain(): Domain[];
    domain(domain: Domain[]): this;
    range(): Range[];
    range(range: Range[]): this;
  }

  function scaleOrdinal<Range = string>(range?: Range[]): ScaleOrdinal<string, Range>;

  // Utilities
  function extent<T>(values: Iterable<T>, accessor?: (d: T) => number | undefined): [number | undefined, number | undefined];
  function min<T>(values: Iterable<T>, accessor?: (d: T) => number | undefined): number | undefined;
  function max<T>(values: Iterable<T>, accessor?: (d: T) => number | undefined): number | undefined;
}
`

/**
 * Gets the D3.js inline script for embedding in HTML.
 *
 * @returns The D3.js implementation as a JavaScript string
 */
export function getD3InlineScript(): string {
  return D3_INLINE_MODULES
}

/**
 * Gets the D3.js CDN script tag for development/fallback.
 *
 * @param cdn - Which CDN to use (default: 'jsdelivr')
 * @returns An HTML script tag loading D3.js from CDN
 */
export function getD3CdnScriptTag(cdn: keyof typeof D3_CDN_URLS = 'jsdelivr'): string {
  return `<script src="${D3_CDN_URLS[cdn]}"></script>`
}

/**
 * Gets the D3.js version string.
 *
 * @returns The version of D3.js used
 */
export function getD3Version(): string {
  return D3_VERSION
}
