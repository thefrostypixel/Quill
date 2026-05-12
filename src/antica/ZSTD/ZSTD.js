/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

window.antica = window.antica || {};

antica.ZSTD = {};

antica.ZSTD.compress = (s = [] ?? new Uint8Array()) => {};
antica.ZSTD.decompress = (s = [] ?? new Uint8Array()) => {

    // Unknown

    // #define
    let ZSTD_dont_use = "ZSTD_dont_use";
    let ZSTD_use_once = "ZSTD_use_once";
    let zdss_init = "zdss_init";
    let ZSTD_f_zstd1 = 0; // 0: Begin file with 4-byte magic number, 1: Don't include magic number.
    let ZSTD_FORCE_DECOMPRESS_SEQUENCES_SHORT;
    let ZSTD_FORCE_DECOMPRESS_SEQUENCES_LONG;



    // https://github.com/facebook/zstd/blob/dev/lib/zstd.h

    // Line 1157
    let ZSTD_FRAMEHEADERSIZE_PREFIX = format => format == ZSTD_f_zstd1 ? 5 : 1;



    // https://github.com/facebook/zstd/blob/dev/lib/common/allocations.h

    let malloc = size => ({});
    let free = ptr => {};

    let ZSTD_malloc = malloc;
    let ZSTD_free = free;

    let ZSTD_customMalloc = ZSTD_malloc;
    let ZSTD_customFree = ZSTD_free;



    // https://github.com/facebook/zstd/blob/dev/lib/decompress/zstd_decompress_block.c

    // Line 2168

    let ZSTD_decompressBlock_internal = (dctx, dst, dstCapacity, src, srcSize, streaming) => {
        let ip = src;

        let litCSize = ZSTD_decodeLiteralsBlock(dctx, src, srcSize, dst, dstCapacity, streaming);
        ip += litCSize;
        srcSize -= litCSize;

        let blockSizeMax = MIN(dstCapacity, ZSTD_blockSizeMax(dctx));
        let totalHistorySize = ZSTD_totalHistorySize(ZSTD_maybeNullPtrAdd(dst, blockSizeMax), dctx.virtualStart);
        /* isLongOffset must be true if there are long offsets.
         * Offsets are long if they are larger than ZSTD_maxShortOffset().
         * We don't expect that to be the case in 64-bit mode.
         *
         * We check here to see if our history is large enough to allow long offsets.
         * If it isn't, then we can't possible have (valid) long offsets. If the offset
         * is invalid, then it is okay to read it incorrectly.
         *
         * If isLongOffsets is true, then we will later check our decoding table to see
         * if it is even possible to generate long offsets.
         */
        let isLongOffset = MEM_32bits() && totalHistorySize > ZSTD_maxShortOffset();
        /* These macros control at build-time which decompressor implementation
         * we use. If neither is defined, we do some inspection and dispatch at
         * runtime.
         */
        /* Set to 1 to avoid computing offset info if we don't need to.
         * Otherwise this value is ignored.
         */
        let usePrefetchDecoder = 1;
        let nbSeq;
        let seqHSize = ZSTD_decodeSeqHeaders(dctx, nbSeq, ip, srcSize);
        ip += seqHSize;
        srcSize -= seqHSize;

        /* If we could potentially have long offsets, or we might want to use the prefetch decoder,
         * compute information about the share of long offsets, and the maximum nbAdditionalBits.
         * NOTE: could probably use a larger nbSeq limit
         */
        if (isLongOffset || !usePrefetchDecoder && totalHistorySize > 1 << 24 && nbSeq > 8) {
            let info = ZSTD_getOffsetInfo(dctx.OFTptr, nbSeq);
            if (isLongOffset && info.maxNbAdditionalBits <= STREAM_ACCUMULATOR_MIN) {
                /* If isLongOffset, but the maximum number of additional bits that we see in our table is small
                 * enough, then we know it is impossible to have to long an offset in this block, so we can
                 * use the regular offset decoder.
                 */
                isLongOffset = ZSTD_lo_isRegularOffset;
            }
            if (!usePrefetchDecoder) {
                let minShare = MEM_64bits() ? 7 : 20; /* heuristic values, correspond to 2.73% and 7.81% */
                usePrefetchDecoder = info.longOffsetShare >= minShare;
            }

            dctx.ddictIsCold = 0;

            if (usePrefetchDecoder) {
                return ZSTD_decompressSequencesLong(dctx, dst, dstCapacity, ip, srcSize, nbSeq, isLongOffset);
            } else if (dctx.litBufferLocation == ZSTD_split) {
                return ZSTD_decompressSequencesSplitLitBuffer(dctx, dst, dstCapacity, ip, srcSize, nbSeq, isLongOffset);
            } else {
                return ZSTD_decompressSequences(dctx, dst, dstCapacity, ip, srcSize, nbSeq, isLongOffset);
            }
        }
    };



    // https://github.com/facebook/zstd/blob/dev/lib/decompress/zstd_decompress.c

    // #define
    let FUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION;

    /* #define
    ZSTD_HEAPMODE 1
    ZSTD_LEGACY_SUPPORT 0
    ZSTD_MAXWINDOWSIZE_DEFAULT (((U32)1 << ZSTD_WINDOWLOG_LIMIT_DEFAULT) + 1)
    ZSTD_NO_FORWARD_PROGRESS_MAX 16
    FSE_STATIC_LINKING_ONLY
    DDICT_HASHSET_MAX_LOAD_FACTOR_COUNT_MULT 4
    DDICT_HASHSET_MAX_LOAD_FACTOR_SIZE_MULT 3
        // These two constants represent SIZE_MULT/COUNT_MULT load factor without using a float.
        // Currently, that means a 0.75 load factor.
        // So, if count * COUNT_MULT / size * SIZE_MULT != 0, then we've exceeded
        // the load factor of the ddict hash set.
    DDICT_HASHSET_TABLE_BASE_SIZE 64
    DDICT_HASHSET_RESIZE_FACTOR 2
    */

    /* #include
    "../common/zstd_deps.h"   // ZSTD_memcpy, ZSTD_memmove, ZSTD_memset
    "../common/allocations.h"  // ZSTD_customMalloc, ZSTD_customCalloc, ZSTD_customFree
    "../common/error_private.h"
    "../common/zstd_internal.h"  // blockProperties_t
    "../common/mem.h"         // low level memory routines
    "../common/bits.h"  // ZSTD_highbit32
    "../common/fse.h"
    "../common/huf.h"
    "../common/xxhash.h" // XXH64_reset, XXH64_update, XXH64_digest, XXH64
    "zstd_decompress_internal.h"   // ZSTD_DCtx
    "zstd_ddict.h"  // ZSTD_DDictDictContent
    "zstd_decompress_block.h"   // ZSTD_decompressBlock_internal
    */

    // TODO ZSTD_setRleBlock, ZSTD_copyRawBlock, ZSTD_decompressBlock_internal, ZSTD_blockHeaderSize, ZSTD_getcBlockSize, ZSTD_frameHeaderSize_internal, ZSTD_DDict_dictContent, ZSTD_DDict_dictSize
    // TODO bt_compressed, bt_raw, bt_rle, bt_reserved, ZSTD_DCtx_trace_end

    // Line 95
    let ZSTD_DDictHashSet_getIndex = (hashSet, dictID) => {
        let hash = XXH64(dictID, 0);
        return hash & hashSet.ddictPtrTableSize - 1;
    };

    // Line 196
    let ZSTD_freeDDictHashSet = (hashSet, customMem) => {
        if (hashSet) {
            if (hashSet.ddictPtrTable) {
                free(hashSet.ddictPtrTable, customMem);
            }
            free(hashSet, customMem);
        }
    };

    // Line 232
    let ZSTD_startingInputLength = ZSTD_FRAMEHEADERSIZE_PREFIX;

    // Line 252 // Important dctx setup
    let ZSTD_initDCtx_internal = dctx => {
        dctx.staticSize = 0;
        dctx.ddict = null;
        dctx.ddictLocal = null;
        dctx.dictEnd = null;
        dctx.ddictIsCold = 0;
        dctx.dictUses = ZSTD_dont_use;
        dctx.inBuff = null;
        dctx.inBuffSize = 0;
        dctx.outBuffSize = 0;
        dctx.streamStage = zdss_init;
        dctx.noForwardProgress = 0;
        dctx.oversizedDuration = 0;
        dctx.isFrameDecompression = 1;
        if (DYNAMIC_BMI2) {
            dctx.bmi2 = ZSTD_cpuSupportsBmi2();
        }
        dctx.ddictSet = null;
        ZSTD_DCtx_resetParameters(dctx);
    };
    
    // Line 294
    let ZSTD_createDCtx_internal = customMem => {
        if (!customMem.customAlloc == !customMem.customFree) {
            let dctx = malloc(sizeof(ZSTD_DCtx), customMem);
            dctx.customMem = customMem;
            ZSTD_initDCtx_internal(dctx);
            return dctx;
        }
    };

    // Line 316
    let ZSTD_clearDict = dctx => {
        ZSTD_freeDDict(dctx.ddictLocal);
        dctx.ddictLocal = null;
        dctx.ddict = null;
        dctx.dictUses = ZSTD_dont_use;
    };

    // Line 324
    let ZSTD_freeDCtx = dctx => {
        if (dctx != undefined) {
            let cMem = dctx.customMem;
            ZSTD_clearDict(dctx);
            free(dctx.inBuff, cMem);
            dctx.inBuff = null;
            if (dctx.ddictSet) {
                ZSTD_freeDDictHashSet(dctx.ddictSet, cMem);
                dctx.ddictSet = NULL;
            }
            ZSTD_customFree(dctx, cMem);
        }
        return 0;
    };

    // Line 953 // Important decompression logic
    let ZSTD_decompressFrame = (dctx = {}, dst = new Uint8Array(), dstCapacity = undefined, src = new Uint8Array(), srcSize = src.length) => {
        let istart = 0;
        let ip = istart;
        let ostart = 0;
        let oend = dstCapacity != 0 ? ostart + dstCapacity : ostart;
        let op = ostart;
        let remainingSrcSize = srcSize;

        /* Frame Header */
        let frameHeaderSize = ZSTD_frameHeaderSize_internal(ip, ZSTD_FRAMEHEADERSIZE_PREFIX(dctx.format), dctx.format);
        ip += frameHeaderSize;
        remainingSrcSize -= frameHeaderSize;

        /* Shrink the blockSizeMax if enabled */
        if (dctx.maxBlockSizeParam != 0) {
            dctx.fParams.blockSizeMax = Math.min(dctx.fParams.blockSizeMax, dctx.maxBlockSizeParam);
        }

        /* Loop on each block */
        while (true) {
            let oBlockEnd = oend;
            let decodedSize;
            let blockProperties;
            let cBlockSize = ZSTD_getcBlockSize(ip, remainingSrcSize, blockProperties);
            ip += ZSTD_blockHeaderSize;
            remainingSrcSize -= ZSTD_blockHeaderSize;
            if (blockProperties.blockType == bt_compressed) {
                decodedSize = ZSTD_decompressBlock_internal(dctx, dst.subarray(op), oBlockEnd - op, src.subarray(ip), cBlockSize, not_streaming);
            } else if (blockProperties.blockType == bt_raw) {
                dst.set(src.subarray(ip, ip + cBlockSize), op);
                decodedSize = cBlockSize;
            } else {
                dst.fill(src[ip], op, op + blockProperties.origSize);
                decodedSize = blockProperties.origSize;
            }
            if (decodedSize) {
                op += decodedSize;
            }
            ip += cBlockSize;
            remainingSrcSize -= cBlockSize;
            if (blockProperties.lastBlock) {
                break;
            }
        }

        if (dctx.fParams.checksumFlag) { /* Frame content checksum verification */
            ip += 4;
            remainingSrcSize -= 4;
        }
        ZSTD_DCtx_trace_end(dctx, op - ostart, ip - istart, /* streaming */ 0);
        return {res: op - ostart, src: ip, srcSize: remainingSrcSize};
    };

    // Line 1068 // Important decompression logic
    let ZSTD_decompressMultiFrame = (dctx, dst, dstCapacity, src, srcSize) => {
        let dstStart = dst;
        while (srcSize >= ZSTD_startingInputLength(dctx.format)) {
           let returned = ZSTD_decompressFrame(dctx, dst, dstCapacity, src, srcSize);
            dst += returned.res;
            dstCapacity -= returned.res;
            src = returned.src;
            srcSize = returned.srcSize;
        }
        return dst - dstStart;
    };

    // Line 1180
    let ZSTD_getDDict = dctx => ZSTD_clearDict(dctx);

    // Line 1197
    let ZSTD_decompressDCtx = (dctx, dst, dstCapacity, src, srcSize) => ZSTD_decompress_usingDDict(dctx, dst, dstCapacity, src, srcSize);

    // Line 1203
    let ZSTD_decompress = (dst, dstCapacity, src, srcSize) => {
        let dctx =  ZSTD_createDCtx_internal(ZSTD_defaultCMem);
        let regenSize = ZSTD_decompressDCtx(dctx, dst, dstCapacity, src, srcSize);
        ZSTD_freeDCtx(dctx);
        return regenSize;
    };

    // Line 1588
    let ZSTD_decompressBegin_usingDict = () => 0;

    // Line 1656
    let ZSTD_decompress_usingDDict = (dctx, dst, dstCapacity, src, srcSize) => ZSTD_decompressMultiFrame(dctx, dst, dstCapacity, src, srcSize);

    return []; // TODO Call ZSTD_decompress.
};
antica.ZSTD.compressString = s => antica.ZSTD.compress(new TextEncoder().encode(s));
antica.ZSTD.decompressString = s => new TextDecoder().decode(new Uint8Array(antica.ZSTD.decompress(s)));


(async () => {
    try {
        let toHex = array => [...array].map(n => (+n).toString(16).toUpperCase().padStart(2, "0")).join("");

        let compressed = [...new Uint8Array(await (await fetch("CompressionTest.zst")).arrayBuffer())];
        let decompressed = antica.ZSTD.decompress(compressed);
        console.log(toHex(decompressed));
        console.log(new TextDecoder().decode(new Uint8Array(decompressed)));
    } catch (e) {
        console.error(e);
    }
})();
