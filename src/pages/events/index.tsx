import { ChangeEventHandler, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  faChevronDown,
  faChevronUp,
  faPlus,
  faSearch,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog } from "@headlessui/react";
import { EventStatus } from "@prisma/client";
import { startCase } from "lodash";
import { SubmitHandler } from "react-hook-form";

import EventFormEditButton from "@/components/Button/event-form-edit-button";
import EventForm from "@/components/Forms/event-form";
import Modal from "@/components/Modal";
import { useAuth } from "@/hooks/auth";
import { useCreateEvent, useEvents } from "@/hooks/events";
import { ItemType, useItemTypes } from "@/hooks/item-types";
import { CreateEvent, Event } from "@/types";

function Table() {
  const router = useRouter();

  const upcoming: EventStatus = "UPCOMING";
  const ongoing: EventStatus = "ONGOING";
  const completed: EventStatus = "COMPLETED";

  function formatDate(dateString: string): string {
    const actualDate = new Date(dateString);
    const day = actualDate.getDate().toString().padStart(2, "0");
    const month = (actualDate.getMonth() + 1).toString().padStart(2, "0");
    const year = actualDate.getFullYear().toString();

    return `${day}/${month}/${year}`;
  }

  const [sortKey, setSortKey] = useState<string>("startDate");
  const [searchWord, setSearchWord] = useState<string>("");
  const [sortMethod, setSortMethod] = useState<string>("asc");
  const [expandedButton, setExpandedButton] = useState<string>("");
  const [modalActive, toggleModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { mutate: createEvent } = useCreateEvent();
  const { data: eventData, isLoading: isEventsLoading } = useEvents(
    sortKey,
    sortMethod,
    searchWord
  );
  const { data: itemTypes } = useItemTypes();

  const { user, isLoaded, role } = useAuth();

  const [formData, setFormData] = useState<Partial<Event>>({
    id: undefined,
    name: "",
    createdBy: "",
    location: "",
    startDate: undefined,
    eventType: "",
    status: undefined
  });

  // The label is what users see, the key is what the server uses
  const headers: { key: string; label: string }[] = [
    { key: "name", label: "Event Name" },
    { key: "createdBy", label: "Created By" },
    { key: "location", label: "Location" },
    { key: "startDate", label: "Date" },
    { key: "eventType", label: "Type" },
    { key: "status", label: "Status" }
  ];

  // will toggle modal visibility for editing events
  const [showAddModal, setShowAddModal] = useState(false);

  // formats input data before passing it on
  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    // Convert startDate to a Date object before assigning it
    if (name === "startDate") {
      const formattedDate = new Date(value);
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: formattedDate
      }));
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value
      }));
    }
  }

  function handleButtonClick(key: string) {
    if (expandedButton === key) {
      setExpandedButton("");
    } else {
      setExpandedButton(key);
    }

    // If the clicked column is already the sort key, toggle the sort method
    if (sortKey === key) {
      setSortMethod(sortMethod === "asc" ? "desc" : "asc");
    } else {
      // If it's a new column, set it as the sort key with ascending order
      setSortKey(key);
      setSortMethod("asc");
    }
  }

  function ToggleChevron(column: string) {
    return (
      <button onClick={() => handleButtonClick(column)}>
        {" "}
        {column === expandedButton ? (
          <FontAwesomeIcon icon={faChevronUp} />
        ) : (
          <FontAwesomeIcon icon={faChevronDown} />
        )}
      </button>
    );
  }

  const submitCreateEvent: SubmitHandler<CreateEvent> = async (data) => {
    createEvent(data, {
      onSuccess: () => {
        setShowAddModal(false);
      }
    });
  };

  return (
    <div>
      {/* HEADER BAR*/}
      <div className=" flex w-full flex-row border-b-[2px] border-slate-300 ">
        <Image
          className="m-10 mb-5 mt-5"
          src="/images/repair_lab_logo.jpg"
          alt="logo"
          width="90"
          height="90"
        />
        <h1 className="mt-[50px] text-3xl font-semibold text-slate-600">
          {" "}
          Event Listings
        </h1>

        {/* ACCOUNT AREA*/}
        <div className="absolute right-10 self-center justify-self-end">
          <span className="mr-2 font-light text-slate-600">
            {isLoaded
              ? `${user?.firstName} ${user?.lastName} ${startCase(
                  role.trim().toLowerCase()
                )}`
              : ""}
          </span>
          <button
            className="h-12 w-12 rounded-full bg-slate-800"
            onClick={() => toggleModal(true)}
          >
            O
          </button>
        </div>
      </div>

      {/* options modal*/}
      <div className=" flex items-center justify-center">
        <Dialog
          open={modalActive}
          onClose={() => toggleModal(false)}
          className="absolute inset-0 flex justify-center p-4 text-center sm:items-center sm:p-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <Dialog.Title className=" flow-root border-slate-300 bg-lightAqua-300 p-4 font-semibold">
              <span className="float-left">
                {" "}
                {showCreateForm && "Create Event"}{" "}
                {!showCreateForm && "Edit Event Details"}{" "}
              </span>
              <button
                onClick={() => toggleModal(false)}
                className="float-right h-6 w-6 items-center rounded-full hover:bg-lightAqua-500"
              >
                <FontAwesomeIcon
                  className="align-middle align-text-top text-xl"
                  icon={faXmark}
                />
              </button>
            </Dialog.Title>
            <Dialog.Description className="p-3 font-light">
              Select each field below to change their contents
            </Dialog.Description>

            {/* main form*/}
            <form>
              <div key={headers[0].key} className="flow-root">
                <label className="float-left m-1 pb-[10px] pl-10 text-sm font-light">
                  {" "}
                  {headers[0].label}
                </label>
                <input
                  type="text"
                  name={headers[0].key}
                  value={
                    formData[headers[0].key as keyof Partial<Event>] as string
                  }
                  onChange={handleInputChange}
                  className="float-right m-1 mr-10 w-48 rounded-md border border-slate-400 p-1 text-sm font-light text-slate-600"
                />
              </div>

              <div key={headers[1].key} className="flow-root">
                <label className="float-left m-1 pb-[10px] pl-10 text-sm font-light">
                  {" "}
                  {headers[1].label}
                </label>
                <input
                  type="text"
                  name={headers[1].key}
                  value={
                    formData[headers[1].key as keyof Partial<Event>] as string
                  }
                  onChange={handleInputChange}
                  className="float-right m-1 mr-10 w-48 rounded-md border border-slate-400 p-1 text-sm font-light text-slate-600"
                />
              </div>

              <div key={headers[2].key} className="flow-root">
                <label className="float-left m-1 pb-[10px] pl-10 text-sm font-light">
                  {" "}
                  {headers[2].label}
                </label>
                <input
                  type="text"
                  name={headers[2].key}
                  value={
                    formData[headers[2].key as keyof Partial<Event>] as string
                  }
                  onChange={handleInputChange}
                  className="float-right m-1 mr-10 w-48 rounded-md border border-slate-400 p-1 text-sm font-light text-slate-600"
                />
              </div>

              <div key={headers[3].key} className="flow-root">
                <label className="float-left m-1 pb-[10px] pl-10 text-sm font-light">
                  {" "}
                  {headers[3].label}
                </label>
                <input
                  type="datetime-local"
                  name={headers[3].key}
                  onChange={handleInputChange}
                  className="float-right m-1 mr-10 h-8 w-48 rounded-md border border-slate-400 p-1 text-sm font-light text-slate-600"
                />
              </div>

              <div key={headers[4].key} className="flow-root">
                <label className="float-left m-1 pb-[10px] pl-10 text-sm font-light">
                  {" "}
                  {headers[4].label}
                </label>
                <select
                  name={headers[4].key}
                  onChange={handleInputChange as ChangeEventHandler}
                  defaultValue={
                    formData[headers[4].key as keyof Partial<Event>] as string
                  }
                  className="float-right m-1 mr-10 h-8 w-48 rounded-md border border-slate-400 bg-white p-1 text-sm font-light text-slate-600"
                >
                  {itemTypes
                    ? itemTypes.map((type: ItemType) => (
                        <option value={type.name} key={type.name}>
                          {" "}
                          {type.name}{" "}
                        </option>
                      ))
                    : []}
                </select>
              </div>

              <div key={headers[5].key} className="flow-root">
                <label className="float-left m-1 pb-[10px] pl-10 text-sm font-light">
                  {" "}
                  {headers[5].label}
                </label>
                <select
                  name={headers[5].key}
                  onChange={handleInputChange as ChangeEventHandler}
                  defaultValue={
                    formData[headers[5].key as keyof Partial<Event>] as string
                  }
                  className="float-right m-1 mr-10 h-8 w-48 rounded-md border border-slate-400 bg-white p-1 text-sm font-light text-slate-600"
                >
                  <option value={upcoming}> UPCOMING </option>
                  <option value={ongoing}> ONGOING </option>
                  <option value={completed}> COMPLETED </option>
                </select>
              </div>

              {/* Bottom button row*/}
              <div className=" mt-3 border-t-[2px] border-slate-200 align-bottom">
                <button
                  type="submit"
                  className="m-1 rounded border border-lightAqua-500 bg-transparent px-2 py-1 text-sm font-light text-lightAqua-500 hover:border-transparent hover:bg-lightAqua-500 hover:text-white"
                >
                  Submit
                </button>

                <button
                  onClick={() => toggleModal(false)}
                  className="m-2 rounded border border-lightAqua-500 bg-transparent px-2 py-1 text-sm font-light text-lightAqua-500 hover:border-transparent hover:bg-lightAqua-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </Dialog>
      </div>

      {/* Search bar above table */}
      <div className="flex justify-center">
        <div className="relative w-5/12 p-4">
          <input
            className="h-10 w-full rounded-3xl border-none bg-gray-100 bg-gray-200 px-5 py-2 text-sm focus:shadow-md focus:outline-none "
            type="search"
            name="search"
            placeholder="Search"
            onChange={(e) => setSearchWord(e.target.value)}
          />
          <button
            className="absolute right-8 top-2/4 -translate-y-2/4 transform cursor-pointer text-gray-500"
            onClick={() => {
              // Handle search submit action here
              console.log("Search submitted");
            }}
          >
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>

        {/* Add event button*/}
        <div className=" p-4 text-center ">
          <button
            className="h-10 w-10 rounded-full bg-gray-200 text-gray-500 focus:shadow-md"
            onClick={() => setShowAddModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <Modal
            setShowPopup={setShowAddModal}
            showModal={showAddModal}
            height="h-3/4"
          >
            <EventForm itemTypes={itemTypes} onSubmit={submitCreateEvent} />
          </Modal>
        </div>
      </div>

      {/* main table*/}
      <div className="flex justify-center">
        <div className="container flex w-full justify-center overflow-hidden">
          {isEventsLoading ? (
            "Loading..."
          ) : (
            <table className="w-10/12 table-auto overflow-hidden rounded-lg">
              <thead>
                <tr className="border-b bg-lightAqua-200 pb-10 text-left ">
                  {headers.map((col) => (
                    <th key={col.key} className="p-2.5 pl-5 font-normal">
                      {" "}
                      {col.label} {ToggleChevron(col.key)}{" "}
                    </th>
                  ))}
                  <th className="w-10 p-2.5 text-justify font-normal">
                    {" "}
                    Edit{" "}
                  </th>
                </tr>
              </thead>

              <tbody className="bg-secondary-50">
                {eventData.map((event: Event) => {
                  return (
                    <tr
                      key={event.name}
                      className="first:ml-50 border-b p-2.5 last:mr-10 even:bg-slate-100 hover:bg-slate-200"
                    >
                      <td className="pl-5 font-light">
                        <button
                          className="text-sm"
                          onClick={() =>
                            router.push(
                              "/events/" + event.id + "/repair-requests"
                            )
                          }
                        >
                          {event.name}
                        </button>
                      </td>
                      <td className="p-2.5 text-sm font-light">
                        {event.createdBy}
                      </td>
                      <td className="text-sm font-light">{event.location}</td>
                      <td className="text-sm font-light">
                        {formatDate(String(event.startDate))}
                      </td>
                      <td className="text-sm font-light">{event.eventType}</td>
                      <td className="text-sm font-light">{event.status}</td>
                      <td className="align-center ml-0 p-2.5 pl-0 text-center">
                        <EventFormEditButton props={event} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Table;
