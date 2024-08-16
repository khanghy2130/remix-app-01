type SortType = "TITLE" | "PRICE" | "RATING";

type Props = {
    chosenSort: SortType;
    setChosenSort: React.Dispatch<React.SetStateAction<SortType>>;
    sortDescending: boolean;
    setSortDescending: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function TagsFilter({
    chosenSort,
    setChosenSort,
    sortDescending,
    setSortDescending,
}: Props) {
    function sortOptionButton(displayText: string, type: SortType) {
        if (chosenSort === type) {
            // selected sort type render
            return (
                <button
                    className="btn"
                    onClick={() => setSortDescending(!sortDescending)}
                >
                    {displayText + (sortDescending ? "(D)" : "(A)")}
                </button>
            );
        } else {
            return (
                <button className="btn" onClick={() => setChosenSort(type)}>
                    {displayText}
                </button>
            );
        }
    }

    return (
        <div className="flex">
            {sortOptionButton("Title", "TITLE")}
            {sortOptionButton("Price", "PRICE")}
            {sortOptionButton("Rating", "RATING")}
        </div>
    );
}
