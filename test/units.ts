import {isLengthUnit} from "../src/parser/utils";
import {DimensionToken} from "../src/@types";


const t = {
        typ: "Dimension",
        val: "0",
        unit: "px"
    };

    const k = {
        typ: "Number",
        val: "0"
    };

    console.debug(isLengthUnit(t));
    console.debug(t.typ == 'Number' && isLengthUnit(<DimensionToken> k));
    console.debug(k.typ == 'Number' && isLengthUnit(<DimensionToken> t));