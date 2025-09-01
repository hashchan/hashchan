import { RiBookmark3Line, RiBookmark3Fill } from "react-icons/ri";

export const Bookmarker = ({
    bookmarked,
    bookmark
}: {
    bookmarked: boolean,
    bookmark: () => void
}) => {

    return (
    <span onClick={bookmark}>
      {bookmarked ? <RiBookmark3Fill color="#fff" /> : <RiBookmark3Line color="#fff" />}
    </span>
  )
}