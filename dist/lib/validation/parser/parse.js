import { ValidationTokenEnum } from './types.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/utils/config.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

[
    ValidationTokenEnum.Star,
    ValidationTokenEnum.HashMark,
    ValidationTokenEnum.AtLeastOnce,
    ValidationTokenEnum.Exclamation,
    ValidationTokenEnum.QuestionMark,
    ValidationTokenEnum.OpenCurlyBrace
];
