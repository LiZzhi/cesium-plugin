type coordArrayConstructorType =
    | Int8ArrayConstructor
    | Uint8ArrayConstructor
    | Uint8ClampedArrayConstructor
    | Int16ArrayConstructor
    | Uint16ArrayConstructor
    | Int32ArrayConstructor
    | Uint32ArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor;

type indexArray = Uint16Array | Uint32Array;

export default class kdbush {
    numItems: number;
    nodeSize: number;
    ids: indexArray;
    coords: InstanceType<coordArrayConstructorType>;
    _pos: number;
    _finished: boolean;
    /**
     * kdbush
     * @param {number} numItems 总数
     * @param {number} [nodeSize=64] 节点数量，当范围内点小于该值时，直接遍历
     * @param {coordArrayConstructorType} [coordArrayConstructor=Float64Array] 坐标数组类型，默认为Float64Array
     */
    constructor(
        numItems: number,
        nodeSize: number = 64,
        coordArrayConstructor: coordArrayConstructorType = Float64Array
    ) {
        this.numItems = +numItems;
        this.nodeSize = Math.min(Math.max(+nodeSize, 2), 65535);
        const IndexArrayType = numItems < 65536 ? Uint16Array : Uint32Array;

        this.ids = new IndexArrayType(numItems);
        this.coords = new coordArrayConstructor(numItems * 2);
        this._pos = 0;
        this._finished = false;
    }

    /**
     * 添加点
     * @param {number} x
     * @param {number} y
     * @returns {number} 当前点位的索引
     */
    add(x: number, y: number): number {
        const index = this._pos >> 1;
        this.ids[index] = index;
        this.coords[this._pos++] = x;
        this.coords[this._pos++] = y;
        return index;
    }

    /**
     * 构建索引
     */
    finish() {
        const numAdded = this._pos >> 1;
        if (numAdded !== this.numItems) {
            throw new Error(`预期为${this.numItems}项，实际添加${numAdded}项!`);
        }
        // 对两个数组进行k -排序以提高搜索效率
        sort(this.ids, this.coords, this.nodeSize, 0, this.numItems - 1, 0);

        this._finished = true;
        return this;
    }

    /**
     * 查找指定区域内的点
     * @param {number} minX
     * @param {number} minY
     * @param {number} maxX
     * @param {number} maxY
     * @returns {number[]} 索引数组
     */
    range(minX: number, minY: number, maxX: number, maxY: number): number[] {
        if (!this._finished) throw new Error("索引未构建，请先执行finish方法!");

        const { ids, coords, nodeSize } = this;
        // [左索引, 右索引, 划分轴{0: Y轴(即划分X左右), 1: X轴(即划分Y上下)}]
        const stack = [0, ids.length - 1, 0];
        const result = [];

        // 在以k排序的数组中递归搜索范围内的项
        while (stack.length) {
            const axis = stack.pop() || 0;
            const right = stack.pop() || 0;
            const left = stack.pop() || 0;

            // 节点数量
            let size = right - left;

            // 如果小于节点数量则直接线性搜索加入结果中，此处也是循环终止处
            if (size <= nodeSize) {
                for (let i = left; i <= right; i++) {
                    const x = coords[2 * i];
                    const y = coords[2 * i + 1];
                    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                        result.push(ids[i]);
                    }
                }
                continue;
            }

            // 找中点索引
            const m = (left + right) >> 1;

            // 在范围内则将中点索引加入结果数组
            const x = coords[2 * m];
            const y = coords[2 * m + 1];
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                result.push(ids[m]);
            }

            // 判断左右(上下)划分区域是否在指定范围内
            // 此处是循环运行的核心，每次上面都pop一对左右(上下)和轴，
            // 在此处判断并砍两半再添加进去，迟早会把所有都遍历计算一遍最终进入线性搜索
            if (axis === 0 ? minX <= x : minY <= y) {
                stack.push(left);
                stack.push(m - 1);
                stack.push(1 - axis);
            }
            if (axis === 0 ? maxX >= x : maxY >= y) {
                stack.push(m + 1);
                stack.push(right);
                stack.push(1 - axis);
            }
        }
        return result;
    }
}

/**
 * 排序
 * @param {indexArray} ids
 * @param {InstanceType<coordArrayConstructorType>} coords
 * @param {number} nodeSize
 * @param {number} left
 * @param {number} right
 * @param {number} axis
 */
function sort(
    ids: indexArray,
    coords: InstanceType<coordArrayConstructorType>,
    nodeSize: number,
    left: number,
    right: number,
    axis: number
) {
    if (right - left <= nodeSize) return;

    const m = (left + right) >> 1; // 中点索引

    // 对中点索引两侧的id和coord进行排序
    select(ids, coords, m, left, right, axis);

    // 交替轴递归排序
    sort(ids, coords, nodeSize, left, m - 1, 1 - axis);
    sort(ids, coords, nodeSize, m + 1, right, 1 - axis);
}

/**
 * Floyd-Rivest 选择算法: 对ids 和 coords 进行排序，使得 [left..k-1] 小于第 k 项
 * @param {indexArray} ids id数组
 * @param {InstanceType<coordArrayConstructorType>} coords 坐标数组
 * @param {number} k 中点索引
 * @param {number} left 左边界索引
 * @param {number} right 右边界索引
 * @param {number} axis 用来代表横纵坐标，横坐标时为0，纵坐标为1
 */
function select(
    ids: indexArray,
    coords: InstanceType<coordArrayConstructorType>,
    k: number,
    left: number,
    right: number,
    axis: number
) {
    while (right > left) {
        // 不知道干了个啥
        if (right - left > 600) {
            const n = right - left + 1;
            const m = k - left + 1;
            const z = Math.log(n);
            const s = 0.5 * Math.exp((2 * z) / 3);
            const sd =
                0.5 *
                Math.sqrt((z * s * (n - s)) / n) *
                (m - n / 2 < 0 ? -1 : 1);
            const newLeft = Math.max(left, Math.floor(k - (m * s) / n + sd));
            const newRight = Math.min(
                right,
                Math.floor(k + ((n - m) * s) / n + sd)
            );
            select(ids, coords, k, newLeft, newRight, axis);
        }

        // 取出坐标，axis为0|1，代表X|Y
        const t = coords[2 * k + axis];
        let i = left;
        let j = right;

        swapItem(ids, coords, left, k);
        if (coords[2 * right + axis] > t) {
            swapItem(ids, coords, left, right);
        }

        while (i < j) {
            swapItem(ids, coords, i, j);
            i++;
            j--;
            while (coords[2 * i + axis] < t) i++;
            while (coords[2 * j + axis] > t) j--;
        }

        if (coords[2 * left + axis] === t) {
            swapItem(ids, coords, left, j);
        } else {
            j++;
            swapItem(ids, coords, j, right);
        }

        if (j <= k) left = j + 1;
        if (k <= j) right = j - 1;
    }
}

/**
 * id和coords排序过程中的前后换位
 * @param {indexArray} ids
 * @param {InstanceType<coordArrayConstructorType>} coords
 * @param {number} i
 * @param {number} j
 */
function swapItem(
    ids: indexArray,
    coords: InstanceType<coordArrayConstructorType>,
    i: number,
    j: number
) {
    swap(ids, i, j);
    swap(coords, 2 * i, 2 * j);
    swap(coords, 2 * i + 1, 2 * j + 1);
}

/**
 * 指定索引换位
 * @param {InstanceType<coordArrayConstructorType>} arr
 * @param {number} i
 * @param {number} j
 */
function swap(
    arr: InstanceType<coordArrayConstructorType>,
    i: number,
    j: number
) {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}
