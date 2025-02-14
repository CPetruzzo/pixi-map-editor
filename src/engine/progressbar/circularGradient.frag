
#define PI 3.1415926538

varying vec2 vUvs;

uniform float progress;
uniform float thicknessInPixels;
uniform float radiusInPixels;
uniform float smoothingInPixels;

uniform vec4 colors[9];
uniform float colorStops[9];
uniform float colorCount;

uniform float fixedPattern;
uniform float reverse;

uniform float uWorldAlpha;

float radToAlpha(float rad) {
  float normalizedThickness = (thicknessInPixels / radiusInPixels) * 0.5;
  float normalizedInnerRadius = 0.5 - normalizedThickness;
  float normalizedFade = smoothingInPixels / radiusInPixels;

  float innerCutout = step(normalizedInnerRadius + normalizedFade, rad);
  float outerCutout = step(rad, 0.5 - normalizedFade);

  float innerFade = smoothstep(normalizedInnerRadius,
                               normalizedInnerRadius + normalizedFade, rad);
  float outerFade = smoothstep(0.5 - normalizedFade, 0.5, rad);
  // float alpha2 = smoothstep(0.5, rad, 0.5);

  return innerFade - outerFade;
}

float arcToAlpha(float arc, float t) {
  float regular = step(PI * -1.0, arc) * step(arc, mix(PI * -1.0, PI, t));
  float reversed = step(mix(PI * -1.0, PI, t), arc) * step(arc, PI);

  return mix(regular, reversed, reverse);
}

vec4 arcToColor(float arc, float t) {

  float progressToUse = mix(t, 1.0, fixedPattern); // fixedPattern ? 1 : t

  float progressInArcRegular = mix(0.01, PI * 2.0, progressToUse);
  float arcProgressRegular = (arc + PI) / progressInArcRegular;

  float progressInArcReversed = mix(-PI * 2.0, 0.01, progressToUse);
  float arcProgressReversed = (arc - PI) / progressInArcReversed;

  // Reverse?
  float arcProgress = mix(arcProgressRegular, arcProgressReversed, reverse);

  if (arcProgress < colorStops[0] || colorCount <= 1.0) {
    // special case for the first one
    return colors[0];
  } else if (arcProgress < colorStops[1] || colorCount <= 2.0) {
    float correctedProgress =
        smoothstep(colorStops[0], colorStops[1], arcProgress);
    return mix(colors[0], colors[1], correctedProgress);
  } else if (arcProgress < colorStops[2] || colorCount <= 3.0) {
    float correctedProgress =
        smoothstep(colorStops[1], colorStops[2], arcProgress);
    return mix(colors[1], colors[2], correctedProgress);
  } else if (arcProgress < colorStops[3] || colorCount <= 4.0) {
    float correctedProgress =
        smoothstep(colorStops[2], colorStops[3], arcProgress);
    return mix(colors[2], colors[3], correctedProgress);
  } else if (arcProgress < colorStops[4] || colorCount <= 5.0) {
    float correctedProgress =
        smoothstep(colorStops[3], colorStops[4], arcProgress);
    return mix(colors[3], colors[4], correctedProgress);
  } else if (arcProgress < colorStops[5] || colorCount <= 6.0) {
    float correctedProgress =
        smoothstep(colorStops[4], colorStops[5], arcProgress);
    return mix(colors[4], colors[5], correctedProgress);
  } else if (arcProgress < colorStops[6] || colorCount <= 7.0) {
    float correctedProgress =
        smoothstep(colorStops[5], colorStops[6], arcProgress);
    return mix(colors[5], colors[6], correctedProgress);
  } else if (arcProgress < colorStops[7] || colorCount <= 8.0) {
    float correctedProgress =
        smoothstep(colorStops[6], colorStops[7], arcProgress);
    return mix(colors[6], colors[7], correctedProgress);
  } else if (arcProgress < colorStops[8] || colorCount <= 9.0) {
    float correctedProgress =
        smoothstep(colorStops[7], colorStops[8], arcProgress);
    return mix(colors[7], colors[8], correctedProgress);
  } else {
    // special case for the last one
    return colors[7];
  }
}

void main() {

  // invert progress if needed.
  float t = mix(progress, 1.0 - progress, reverse);

  float dX = 0.5 - vUvs.x;
  float dY = 0.5 - vUvs.y;
  float rad = sqrt(dX * dX + dY * dY);
  float arc = atan(dX, -dY);

  vec4 finalColor = arcToColor(arc, t);

  finalColor.a *= radToAlpha(rad) * arcToAlpha(arc, t) * uWorldAlpha;
  finalColor.rgb *= finalColor.a;

  gl_FragColor = finalColor;
}