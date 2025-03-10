export class Effects {
    constructor() {
        this.effects = new Map();
    }

    addEffect(name, effect) {
        this.effects.set(name, effect);
    }

    removeEffect(name) {
        this.effects.delete(name);
    }

    getEffect(name) {
        return this.effects.get(name);
    }

    applyEffects(context) {
        for (const effect of this.effects.values()) {
            effect.apply(context);
        }
    }
} 