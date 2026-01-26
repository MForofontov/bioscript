"use strict";
var bioseqStream = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // dist/browser-fasta.js
  var require_browser_fasta = __commonJS({
    "dist/browser-fasta.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parseFastaBrowser = parseFastaBrowser;
      exports.writeFastaBrowser = writeFastaBrowser;
      exports.parseFastaText = parseFastaText;
      async function* parseFastaBrowser(file) {
        const textDecoder = new TextDecoder("utf-8");
        let buffer = "";
        let currentRecord = null;
        let stream;
        if (file instanceof File && file.name.endsWith(".gz")) {
          stream = file.stream().pipeThrough(new DecompressionStream("gzip"));
        } else {
          stream = file.stream();
        }
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done)
              break;
            buffer += textDecoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed)
                continue;
              if (trimmed.startsWith(">")) {
                if (currentRecord && currentRecord.id) {
                  yield currentRecord;
                }
                const header = trimmed.substring(1);
                const spaceIndex = header.indexOf(" ");
                if (spaceIndex === -1) {
                  currentRecord = { id: header, description: "", sequence: "" };
                } else {
                  currentRecord = {
                    id: header.substring(0, spaceIndex),
                    description: header.substring(spaceIndex + 1),
                    sequence: ""
                  };
                }
              } else if (currentRecord) {
                currentRecord.sequence = (currentRecord.sequence || "") + trimmed;
              }
            }
          }
          if (buffer) {
            const trimmed = buffer.trim();
            if (currentRecord && trimmed && !trimmed.startsWith(">")) {
              currentRecord.sequence = (currentRecord.sequence || "") + trimmed;
            }
          }
          if (currentRecord && currentRecord.id) {
            yield currentRecord;
          }
        } finally {
          reader.releaseLock();
        }
      }
      function writeFastaBrowser(records, lineWidth = 80) {
        const lines = [];
        for (const record of records) {
          lines.push(">" + record.id + (record.description ? " " + record.description : ""));
          for (let i = 0; i < record.sequence.length; i += lineWidth) {
            lines.push(record.sequence.substring(i, i + lineWidth));
          }
        }
        return new Blob([lines.join("\n") + "\n"], { type: "text/plain" });
      }
      function parseFastaText(text) {
        const records = [];
        let currentRecord = null;
        const lines = text.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed)
            continue;
          if (trimmed.startsWith(">")) {
            if (currentRecord && currentRecord.id) {
              records.push(currentRecord);
            }
            const header = trimmed.substring(1);
            const spaceIndex = header.indexOf(" ");
            if (spaceIndex === -1) {
              currentRecord = { id: header, description: "", sequence: "" };
            } else {
              currentRecord = {
                id: header.substring(0, spaceIndex),
                description: header.substring(spaceIndex + 1),
                sequence: ""
              };
            }
          } else if (currentRecord) {
            currentRecord.sequence = (currentRecord.sequence || "") + trimmed;
          }
        }
        if (currentRecord && currentRecord.id) {
          records.push(currentRecord);
        }
        return records;
      }
    }
  });

  // dist/browser-fastq.js
  var require_browser_fastq = __commonJS({
    "dist/browser-fastq.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parseFastqBrowser = parseFastqBrowser;
      exports.writeFastqBrowser = writeFastqBrowser;
      exports.parseFastqText = parseFastqText;
      exports.convertQualityBrowser = convertQualityBrowser;
      async function* parseFastqBrowser(file) {
        const textDecoder = new TextDecoder("utf-8");
        let buffer = "";
        let lineNumber = 0;
        let currentRecord = {};
        let stream;
        if (file instanceof File && file.name.endsWith(".gz")) {
          stream = file.stream().pipeThrough(new DecompressionStream("gzip"));
        } else {
          stream = file.stream();
        }
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done)
              break;
            buffer += textDecoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              const position = lineNumber % 4;
              switch (position) {
                case 0: {
                  if (!trimmed.startsWith("@")) {
                    throw new Error(`Expected '@' at line ${lineNumber}, got: ${trimmed.substring(0, 20)}`);
                  }
                  const header = trimmed.substring(1);
                  const spaceIndex = header.indexOf(" ");
                  if (spaceIndex === -1) {
                    currentRecord = { id: header, description: "" };
                  } else {
                    currentRecord = {
                      id: header.substring(0, spaceIndex),
                      description: header.substring(spaceIndex + 1)
                    };
                  }
                  break;
                }
                case 1:
                  currentRecord.sequence = trimmed;
                  break;
                case 2:
                  if (!trimmed.startsWith("+")) {
                    throw new Error(`Expected '+' at line ${lineNumber}, got: ${trimmed.substring(0, 20)}`);
                  }
                  break;
                case 3:
                  currentRecord.quality = trimmed;
                  if (currentRecord.sequence && currentRecord.sequence.length !== currentRecord.quality.length) {
                    throw new Error(`Sequence/quality length mismatch for ${currentRecord.id}: ${currentRecord.sequence.length} vs ${currentRecord.quality.length}`);
                  }
                  yield currentRecord;
                  currentRecord = {};
                  break;
              }
              lineNumber++;
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
      function writeFastqBrowser(records) {
        const lines = [];
        for (const record of records) {
          lines.push("@" + record.id + (record.description ? " " + record.description : ""));
          lines.push(record.sequence);
          lines.push("+");
          lines.push(record.quality);
        }
        return new Blob([lines.join("\n") + "\n"], { type: "text/plain" });
      }
      function parseFastqText(text) {
        const records = [];
        const lines = text.split("\n");
        let lineNumber = 0;
        let currentRecord = {};
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            lineNumber++;
            continue;
          }
          const position = lineNumber % 4;
          switch (position) {
            case 0: {
              if (!trimmed.startsWith("@")) {
                throw new Error(`Expected '@' at line ${lineNumber}`);
              }
              const header = trimmed.substring(1);
              const spaceIndex = header.indexOf(" ");
              if (spaceIndex === -1) {
                currentRecord = { id: header, description: "" };
              } else {
                currentRecord = {
                  id: header.substring(0, spaceIndex),
                  description: header.substring(spaceIndex + 1)
                };
              }
              break;
            }
            case 1:
              currentRecord.sequence = trimmed;
              break;
            case 2:
              if (!trimmed.startsWith("+")) {
                throw new Error(`Expected '+' at line ${lineNumber}`);
              }
              break;
            case 3:
              currentRecord.quality = trimmed;
              if (currentRecord.sequence && currentRecord.sequence.length !== currentRecord.quality.length) {
                throw new Error(`Sequence/quality length mismatch for ${currentRecord.id}`);
              }
              records.push(currentRecord);
              currentRecord = {};
              break;
          }
          lineNumber++;
        }
        return records;
      }
      function convertQualityBrowser(quality, fromEncoding, toEncoding) {
        if (fromEncoding === toEncoding) {
          return quality;
        }
        const offset = toEncoding - fromEncoding;
        return quality.split("").map((char) => String.fromCharCode(char.charCodeAt(0) + offset)).join("");
      }
    }
  });

  // dist/browser-stats.js
  var require_browser_stats = __commonJS({
    "dist/browser-stats.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.calculateStatsBrowser = calculateStatsBrowser;
      exports.calculateStatsSync = calculateStatsSync;
      exports.calculateN50Browser = calculateN50Browser;
      exports.calculateL50Browser = calculateL50Browser;
      var QualityEncoding;
      (function(QualityEncoding2) {
        QualityEncoding2[QualityEncoding2["Phred33"] = 33] = "Phred33";
        QualityEncoding2[QualityEncoding2["Phred64"] = 64] = "Phred64";
      })(QualityEncoding || (QualityEncoding = {}));
      function decodeQualityScores(quality, encoding) {
        return quality.split("").map((char) => char.charCodeAt(0) - encoding);
      }
      async function calculateStatsBrowser(records, qualityEncoding = QualityEncoding.Phred33) {
        let totalSequences = 0;
        let totalBases = 0;
        let gcCount = 0;
        let atCount = 0;
        let nCount = 0;
        let ambiguousCount = 0;
        let minLength = Infinity;
        let maxLength = 0;
        let sumOfSquares = 0;
        let totalQualitySum = 0;
        let totalQualityBases = 0;
        let minQuality = Infinity;
        let maxQuality = 0;
        let q20Count = 0;
        let q30Count = 0;
        const lengthDistribution = /* @__PURE__ */ new Map();
        for await (const record of records) {
          const sequence = record.sequence.toUpperCase();
          const length = sequence.length;
          totalSequences++;
          totalBases += length;
          sumOfSquares += length * length;
          minLength = Math.min(minLength, length);
          maxLength = Math.max(maxLength, length);
          lengthDistribution.set(length, (lengthDistribution.get(length) || 0) + 1);
          for (let i = 0; i < length; i++) {
            const base = sequence[i];
            if (base === "G" || base === "C") {
              gcCount++;
            } else if (base === "A" || base === "T" || base === "U") {
              atCount++;
            } else if (base === "N") {
              nCount++;
            } else if ("RYKMSWBDHV".includes(base)) {
              ambiguousCount++;
            }
          }
          if ("quality" in record && record.quality) {
            const qualities = decodeQualityScores(record.quality, qualityEncoding);
            for (const q of qualities) {
              totalQualitySum += q;
              totalQualityBases++;
              minQuality = Math.min(minQuality, q);
              maxQuality = Math.max(maxQuality, q);
              if (q >= 20)
                q20Count++;
              if (q >= 30)
                q30Count++;
            }
          }
        }
        let medianLength = 0;
        if (lengthDistribution.size > 0) {
          const sortedLengths = Array.from(lengthDistribution.keys()).sort((a, b) => a - b);
          const halfPoint = Math.floor(totalSequences / 2);
          let count = 0;
          for (const length of sortedLengths) {
            count += lengthDistribution.get(length);
            if (count >= halfPoint) {
              medianLength = length;
              break;
            }
          }
        }
        const meanLength = totalSequences > 0 ? totalBases / totalSequences : 0;
        const variance = totalSequences > 0 ? sumOfSquares / totalSequences - meanLength * meanLength : 0;
        const stdDevLength = Math.sqrt(Math.max(0, variance));
        const allLengths = Array.from(lengthDistribution.entries()).flatMap(([length, count]) => Array(count).fill(length));
        const n50 = calculateN50Browser(allLengths);
        const l50 = calculateL50Browser(allLengths);
        const stats = {
          totalSequences,
          totalBases,
          gcContent: totalBases > 0 ? gcCount / totalBases * 100 : 0,
          atContent: totalBases > 0 ? atCount / totalBases * 100 : 0,
          nContent: totalBases > 0 ? nCount / totalBases * 100 : 0,
          ambiguousBasesCount: ambiguousCount,
          minLength: minLength === Infinity ? 0 : minLength,
          maxLength,
          meanLength,
          medianLength,
          stdDevLength,
          n50,
          l50,
          lengthDistribution
        };
        if (totalQualityBases > 0) {
          stats.meanQuality = totalQualitySum / totalQualityBases;
          stats.minQuality = minQuality === Infinity ? 0 : minQuality;
          stats.maxQuality = maxQuality;
          stats.q20Percent = q20Count / totalQualityBases * 100;
          stats.q30Percent = q30Count / totalQualityBases * 100;
        }
        return stats;
      }
      function calculateStatsSync(records, qualityEncoding = QualityEncoding.Phred33) {
        let totalSequences = 0;
        let totalBases = 0;
        let gcCount = 0;
        let atCount = 0;
        let nCount = 0;
        let ambiguousCount = 0;
        let minLength = Infinity;
        let maxLength = 0;
        let sumOfSquares = 0;
        let totalQualitySum = 0;
        let totalQualityBases = 0;
        let minQuality = Infinity;
        let maxQuality = 0;
        let q20Count = 0;
        let q30Count = 0;
        const lengthDistribution = /* @__PURE__ */ new Map();
        for (const record of records) {
          const sequence = record.sequence.toUpperCase();
          const length = sequence.length;
          totalSequences++;
          totalBases += length;
          sumOfSquares += length * length;
          minLength = Math.min(minLength, length);
          maxLength = Math.max(maxLength, length);
          lengthDistribution.set(length, (lengthDistribution.get(length) || 0) + 1);
          for (let i = 0; i < length; i++) {
            const base = sequence[i];
            if (base === "G" || base === "C") {
              gcCount++;
            } else if (base === "A" || base === "T" || base === "U") {
              atCount++;
            } else if (base === "N") {
              nCount++;
            } else if ("RYKMSWBDHV".includes(base)) {
              ambiguousCount++;
            }
          }
          if ("quality" in record && record.quality) {
            const qualities = decodeQualityScores(record.quality, qualityEncoding);
            for (const q of qualities) {
              totalQualitySum += q;
              totalQualityBases++;
              minQuality = Math.min(minQuality, q);
              maxQuality = Math.max(maxQuality, q);
              if (q >= 20)
                q20Count++;
              if (q >= 30)
                q30Count++;
            }
          }
        }
        let medianLength = 0;
        if (lengthDistribution.size > 0) {
          const sortedLengths = Array.from(lengthDistribution.keys()).sort((a, b) => a - b);
          const halfPoint = Math.floor(totalSequences / 2);
          let count = 0;
          for (const length of sortedLengths) {
            count += lengthDistribution.get(length);
            if (count >= halfPoint) {
              medianLength = length;
              break;
            }
          }
        }
        const meanLength = totalSequences > 0 ? totalBases / totalSequences : 0;
        const variance = totalSequences > 0 ? sumOfSquares / totalSequences - meanLength * meanLength : 0;
        const stdDevLength = Math.sqrt(Math.max(0, variance));
        const allLengths = Array.from(lengthDistribution.entries()).flatMap(([length, count]) => Array(count).fill(length));
        const n50 = calculateN50Browser(allLengths);
        const l50 = calculateL50Browser(allLengths);
        const stats = {
          totalSequences,
          totalBases,
          gcContent: totalBases > 0 ? gcCount / totalBases * 100 : 0,
          atContent: totalBases > 0 ? atCount / totalBases * 100 : 0,
          nContent: totalBases > 0 ? nCount / totalBases * 100 : 0,
          ambiguousBasesCount: ambiguousCount,
          minLength: minLength === Infinity ? 0 : minLength,
          maxLength,
          meanLength,
          medianLength,
          stdDevLength,
          n50,
          l50,
          lengthDistribution
        };
        if (totalQualityBases > 0) {
          stats.meanQuality = totalQualitySum / totalQualityBases;
          stats.minQuality = minQuality === Infinity ? 0 : minQuality;
          stats.maxQuality = maxQuality;
          stats.q20Percent = q20Count / totalQualityBases * 100;
          stats.q30Percent = q30Count / totalQualityBases * 100;
        }
        return stats;
      }
      function calculateN50Browser(lengths) {
        if (lengths.length === 0)
          return 0;
        const sorted = [...lengths].sort((a, b) => b - a);
        const totalLength = sorted.reduce((sum2, len) => sum2 + len, 0);
        const halfTotal = totalLength / 2;
        let sum = 0;
        for (const length of sorted) {
          sum += length;
          if (sum >= halfTotal) {
            return length;
          }
        }
        return sorted[sorted.length - 1];
      }
      function calculateL50Browser(lengths) {
        if (lengths.length === 0)
          return 0;
        const sorted = [...lengths].sort((a, b) => b - a);
        const totalLength = sorted.reduce((sum2, len) => sum2 + len, 0);
        const halfTotal = totalLength / 2;
        let sum = 0;
        for (let i = 0; i < sorted.length; i++) {
          sum += sorted[i];
          if (sum >= halfTotal) {
            return i + 1;
          }
        }
        return sorted.length;
      }
    }
  });

  // dist/browser-bundle.js
  var require_browser_bundle = __commonJS({
    "dist/browser-bundle.js"(exports) {
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.calculateL50Browser = exports.calculateN50Browser = exports.calculateStatsSync = exports.calculateStatsBrowser = exports.convertQualityBrowser = exports.parseFastqText = exports.writeFastqBrowser = exports.parseFastqBrowser = exports.parseFastaText = exports.writeFastaBrowser = exports.parseFastaBrowser = exports.QualityEncoding = void 0;
      var QualityEncoding;
      (function(QualityEncoding2) {
        QualityEncoding2["Phred33"] = "phred33";
        QualityEncoding2["Phred64"] = "phred64";
      })(QualityEncoding || (exports.QualityEncoding = QualityEncoding = {}));
      var browser_fasta_1 = require_browser_fasta();
      Object.defineProperty(exports, "parseFastaBrowser", { enumerable: true, get: function() {
        return browser_fasta_1.parseFastaBrowser;
      } });
      Object.defineProperty(exports, "writeFastaBrowser", { enumerable: true, get: function() {
        return browser_fasta_1.writeFastaBrowser;
      } });
      Object.defineProperty(exports, "parseFastaText", { enumerable: true, get: function() {
        return browser_fasta_1.parseFastaText;
      } });
      var browser_fastq_1 = require_browser_fastq();
      Object.defineProperty(exports, "parseFastqBrowser", { enumerable: true, get: function() {
        return browser_fastq_1.parseFastqBrowser;
      } });
      Object.defineProperty(exports, "writeFastqBrowser", { enumerable: true, get: function() {
        return browser_fastq_1.writeFastqBrowser;
      } });
      Object.defineProperty(exports, "parseFastqText", { enumerable: true, get: function() {
        return browser_fastq_1.parseFastqText;
      } });
      Object.defineProperty(exports, "convertQualityBrowser", { enumerable: true, get: function() {
        return browser_fastq_1.convertQualityBrowser;
      } });
      var browser_stats_1 = require_browser_stats();
      Object.defineProperty(exports, "calculateStatsBrowser", { enumerable: true, get: function() {
        return browser_stats_1.calculateStatsBrowser;
      } });
      Object.defineProperty(exports, "calculateStatsSync", { enumerable: true, get: function() {
        return browser_stats_1.calculateStatsSync;
      } });
      Object.defineProperty(exports, "calculateN50Browser", { enumerable: true, get: function() {
        return browser_stats_1.calculateN50Browser;
      } });
      Object.defineProperty(exports, "calculateL50Browser", { enumerable: true, get: function() {
        return browser_stats_1.calculateL50Browser;
      } });
    }
  });
  return require_browser_bundle();
})();
