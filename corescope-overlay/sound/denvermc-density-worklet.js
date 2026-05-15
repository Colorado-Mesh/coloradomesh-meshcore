class ColoradoMeshDensityProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'density', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'priority', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'pulse', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'level', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();
    this.phaseA = 0;
    this.phaseB = 0;
    this.phaseC = 0;
    this.pulsePhase = 0;
    this.noise = 0;
    this.smoothDensity = 0;
    this.smoothPriority = 0;
    this.smoothPulse = 0;
    this.smoothLevel = 0;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const densityTarget = parameters.density[0] || 0;
    const priorityTarget = parameters.priority[0] || 0;
    const pulseTarget = parameters.pulse[0] || 0;
    const mode = parameters.mode[0] || 0;
    const levelTarget = parameters.level[0] || 0;

    const modeTilt = Math.max(0, Math.min(1, mode));
    const root = 110 + modeTilt * 38;
    const fifth = root * 1.5;
    const octave = root * 2;
    const pulseBase = 0.85 + pulseTarget * 4.8 + densityTarget * 2.4;

    for (let i = 0; i < output[0].length; i += 1) {
      this.smoothDensity += (densityTarget - this.smoothDensity) * 0.0018;
      this.smoothPriority += (priorityTarget - this.smoothPriority) * 0.0024;
      this.smoothPulse += (pulseTarget - this.smoothPulse) * 0.0022;
      this.smoothLevel += (levelTarget - this.smoothLevel) * 0.002;

      this.phaseA += root / sampleRate;
      this.phaseB += fifth / sampleRate;
      this.phaseC += octave / sampleRate;
      this.pulsePhase += pulseBase / sampleRate;
      if (this.phaseA >= 1) this.phaseA -= 1;
      if (this.phaseB >= 1) this.phaseB -= 1;
      if (this.phaseC >= 1) this.phaseC -= 1;
      if (this.pulsePhase >= 1) this.pulsePhase -= 1;

      this.noise = this.noise * 0.985 + (Math.random() * 2 - 1) * 0.015;
      const a = Math.sin(this.phaseA * Math.PI * 2);
      const b = Math.sin(this.phaseB * Math.PI * 2) * 0.55;
      const c = Math.sin(this.phaseC * Math.PI * 2) * 0.28;
      const pulseShape = Math.max(0, Math.sin(this.pulsePhase * Math.PI * 2));
      const pulse = Math.pow(pulseShape, 6) * (0.14 + this.smoothPulse * 0.28);
      const shimmer = this.noise * (0.012 + this.smoothDensity * 0.026 + this.smoothPriority * 0.02);
      const bed = (a + b + c) * (0.035 + this.smoothDensity * 0.13);
      const priorityLift = Math.sin((this.phaseC + this.phaseB) * Math.PI * 2) * this.smoothPriority * 0.055;
      const sample = (bed + pulse + shimmer + priorityLift) * this.smoothLevel;

      for (let ch = 0; ch < output.length; ch += 1) output[ch][i] = sample;
    }

    return true;
  }
}

registerProcessor('colorado-mesh-density', ColoradoMeshDensityProcessor);
